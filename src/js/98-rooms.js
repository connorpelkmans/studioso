/* ===== module: 98-rooms.js ===== */
/* Studyboard 1.11 */
(() => {
  /* Connection (same as the groups module) */
  const stub = () => window.__sbGroupsStub || null;
  const cli = () => { const s = stub(); return s ? s.client : (sbActive() ? sb : null); };
  const me = () => { const s = stub(); return s ? s.user : sbUser; };
  const online = () => !!cli() && !!me();
  const myId = () => (me() || {}).id || "";

  const LIMITS = {free: {people: 4, minutes: 180}, pro: {people: 30, minutes: 180}};
  const LENGTHS = [25, 50, 90];
  const BREAK_MS = 5 * 60000;
  const MOMENT_MS = BREAK_MS + 10 * 60000;
  const STALE_MS = 5 * 60000;
  const PING_MS = 2 * 60000;
  const CHEERS = [["clap", "👏", "Clap"], ["fire", "🔥", "You're on Fire"], ["muscle", "💪", "Keep Going"], ["star", "⭐", "Star"], ["heart", "💖", "Love It"]];
  const CHEER = Object.fromEntries(CHEERS.map(c => [c[0], c]));

  function rErr(e){
    const m = String((e && (e.message || e.error_description || e.details)) || e || ""), code = String((e && e.code) || "");
    if (/fetch|network|Load failed|timed? ?out/i.test(m)) return new Error("Couldn't reach Studyboard. Check your internet connection and try again.");
    if (["42P01", "42883", "PGRST202", "PGRST205", "PGRST200"].includes(code) || /does not exist|Could not find the (function|table)|schema cache/i.test(m))
      return Object.assign(new Error(srvSetup("Study Together", "rooms.sql")), {setup: true});
    const k = m.match(/SB_ROOM_([A-Z]+):\s*([\s\S]*)$/);
    if (k) return Object.assign(new Error(k[2].trim()), {kind: k[1]});
    if (/Sign in first|JWT|not authenticated/i.test(m)) return new Error("Sign in to Studyboard first, then try again.");
    if (code === "42501" || /row-level security|permission denied/i.test(m)) return new Error("You don't have permission to do that in this group.");
    return new Error(m.replace(/^SB_[A-Z0-9_]+:\s*/, "").slice(0, 160) || "Something went wrong. Try again.");
  }
  const q = async p => { let r; try { r = await p; } catch(e) { throw rErr(e); } if (r && r.error) throw rErr(r.error); return r ? r.data : null; };
  const first = r => (Array.isArray(r) ? r[0] : r) || null;
  const api = {
    now: () => q(cli().rpc("room_now")),
    limits: async gid => first(await q(cli().rpc("room_limits", {p_group: gid}))),
    room: gid => q(cli().from("study_rooms").select("*").eq("group_id", gid).maybeSingle()),
    live: () => q(cli().from("study_rooms").select("id,group_id,started_by,starter_name,goal,minutes,started_at,ends_at,status").eq("status", "active")),
    people: rid => q(cli().from("study_room_people").select("*").eq("room_id", rid)),
    group: gid => q(cli().from("study_groups").select("id,name,owner_id").eq("id", gid).maybeSingle()),
    groupNames: ids => q(cli().from("study_groups").select("id,name,owner_id").in("id", ids)),
    members: gid => q(cli().from("group_members").select("user_id,display_name").eq("group_id", gid)),
    inAnyGroup: () => q(cli().from("group_members").select("group_id").eq("user_id", myId()).limit(1)),
    start: async (gid, minutes, goal) => first(await q(cli().rpc("start_room", {p_group: gid, p_minutes: minutes, p_goal: goal}))),
    join: async (rid, goal) => first(await q(cli().rpc("join_room", {p_room: rid, p_goal: goal}))),
    leave: rid => q(cli().rpc("leave_room", {p_room: rid})),
    ping: rid => q(cli().rpc("room_ping", {p_room: rid})),
    end: rid => q(cli().rpc("end_room", {p_room: rid}))
  };

  /* ---------- State ---------- */
  const R = {uid: undefined, rooms: {}, people: {}, groups: {}, members: {}, limits: {}, err: {}, setup: false, loading: {}, loaded: {}, loadedAt: {},
    live: {}, liveAt: 0, liveBusy: false, hasGroups: undefined, pageGid: null, draft: {}, busy: false,
    ch: null, chGid: null, chReady: false, chTriedPublic: false, tracked: false, presence: new Map(), presenceOK: false,
    nch: null, offset: 0, clockAt: 0, mine: null, tickT: 0, pingT: 0, lastCheer: 0, pendingToast: null};
  const now = () => Date.now() + R.offset;
  const ts = x => { const t = Date.parse(x || ""); return isNaN(t) ? 0 : t; };
  const str = (x, n) => String(x == null ? "" : x).slice(0, n);
  const plural = (n, w, ws) => `${n} ${n === 1 ? w : (ws || w + "s")}`;
  const hashOf = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  const hueOf = s => COLORS[parseInt(hashOf(String(s || "x")), 36) % COLORS.length];
  const initials = n => { const w = String(n || "?").trim().split(/\s+/).filter(Boolean); return ((w[0] || "?")[0] + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase(); };
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch(e) {} return null; };
  const lsJSON = (k, d) => { try { const v = JSON.parse(ls(k) || "null"); return v == null ? d : v; } catch(e) { return d; } };
  const reduceMotion = () => (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) || styleCfg().celebrate === false || !!(window.SBMotion && SBMotion.noParticles());
  const noticesOn = () => (state.settings || {}).roomNotice !== false;
  const joinNames = a => a.length <= 1 ? (a[0] || "") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
  const minLabel = m => m % 60 === 0 && m >= 60 ? plural(m / 60, "hour") : `${m} min`;

  function phase(room){
    if (!room) return "none";
    const t = now(), end = ts(room.ends_at);
    if (room.status === "active" && t < end) return "live";
    return "over";
  }
  const isLive = room => phase(room) === "live";

  /* Your session (kept on this device so a reload or a closed tab picks up where you were) */
  const MK = () => "sb:room:" + myId();
  function loadMine(){ const m = lsJSON(MK(), null); return m && m.rid && Array.isArray(m.segs) ? m : null; }
  function saveMine(){ if (!myId()) return; if (R.mine) ls(MK(), JSON.stringify(R.mine)); else ls(MK(), null); }
  const lastSeg = () => R.mine && R.mine.segs.length ? R.mine.segs[R.mine.segs.length - 1] : null;
  const inRoom = rid => !!R.mine && !R.mine.done && !!lastSeg() && !lastSeg()[1] && (!rid || R.mine.rid === rid);
  function focusedMs(m, endAt){
    let t = 0;
    m.segs.forEach(([a, b]) => { const s = Math.max(a, m.startedAt), e = Math.min(b || endAt, endAt, m.endsAt); if (e > s) t += e - s; });
    return t;
  }
  // Rooms whose minutes this account already recorded
  const RECK = "sb:roomRec";
  function recorded(rid){ return ((state.settings || {}).roomsDone || []).includes(rid) || lsJSON(RECK, []).includes(rid); }
  function markRecorded(rid){
    const a = lsJSON(RECK, []).filter(x => x !== rid).concat(rid).slice(-30); ls(RECK, JSON.stringify(a));
    const b = ((state.settings || {}).roomsDone || []).filter(x => x !== rid).concat(rid).slice(-12);
    state.settings = Object.assign({}, state.settings, {roomsDone: b}); saveSettings();
  }
  function myName(gid){
    const n = ls("sb:grpName:" + myId());
    if (n) return str(n, 40);
    const m = (R.members[gid] || []).find(x => x.user_id === myId());
    return str((m && m.display_name) || "You", 40);
  }
  function rememberNames(rid){
    const m = R.mine; if (!m || m.rid !== rid) return;
    m.names = m.names || {};
    (R.people[rid] || []).forEach(p => { if (p.user_id !== myId() && p.display_name) m.names[p.user_id] = str(p.display_name, 40); });
    if (R.chGid === m.gid) R.presence.forEach((p, id) => { if (id !== myId() && p.n) m.names[id] = p.n; });
    const ks = Object.keys(m.names); if (ks.length > 40) ks.slice(0, ks.length - 40).forEach(k => delete m.names[k]);
  }

  /* Server clock */
  async function syncClock(force){
    if (!online() || (!force && Date.now() - R.clockAt < 10 * 60000)) return;
    try {
      const t0 = Date.now(), s = await api.now(), t1 = Date.now(), srv = ts(first(s));
      if (srv && t1 - t0 < 4000) { R.offset = Math.round(srv - (t0 + t1) / 2); R.clockAt = t1; }
    } catch(e) { }
  }

  /* Loading */
  function limitsFor(gid){
    const l = R.limits[gid];
    if (l) return l;
    const pw = typeof PLAN !== "undefined" && PLAN && PLAN.paywall();
    const g = R.groups[gid], ownerMe = g && g.owner_id === myId();
    const pro = !pw || (ownerMe && (PLAN.limitsPro ? PLAN.limitsPro() : PLAN.isPro()));
    return Object.assign({pro: pro && pw, paywall: !!pw, guess: true}, pro ? LIMITS.pro : LIMITS.free);
  }
  async function loadRoom(gid){
    if (R.loading[gid] || !online()) return;
    R.loading[gid] = true;
    try {
      const soft = p => p.catch(e => { if (e.setup) throw e; return null; });
      const [room, lim, g, mem] = await Promise.all([api.room(gid), soft(api.limits(gid)), soft(api.group(gid)), soft(api.members(gid))]);
      if (g) R.groups[gid] = g;
      if (mem) R.members[gid] = mem;
      if (lim && lim.max_people) R.limits[gid] = {people: Number(lim.max_people), minutes: Number(lim.max_minutes), pro: !!lim.owner_pro, paywall: !!lim.paywall};
      if (room) { R.people[room.id] = await api.people(room.id) || []; }
      setRoom(gid, room || null);
      R.err[gid] = ""; R.setup = false; R.hasGroups = true;
      await syncClock();
    } catch(e) { R.err[gid] = e.message; R.setup = !!e.setup; }
    R.loading[gid] = false; R.loaded[gid] = true; R.loadedAt[gid] = Date.now();
    draw(); need();
  }
  // A room row arrived (loaded or live)
  function setRoom(gid, room){
    const prev = R.rooms[gid];
    R.rooms[gid] = room;
    if (room && isLive(room)) R.live[gid] = room; else delete R.live[gid];
    const m = R.mine;
    if (!m || m.done || m.gid !== gid) return;
    if (room && room.id === m.rid) {
      m.startedAt = ts(room.started_at) || m.startedAt;
      m.endsAt = ts(room.ends_at) || m.endsAt;
      if (room.status !== "active") m.endsAt = Math.min(m.endsAt, now());
      saveMine();
    } else if ((room && room.id !== m.rid) || (!room && prev && prev.id === m.rid)) {
      m.endsAt = Math.min(m.endsAt, room ? ts(room.started_at) || now() : now());
      saveMine();
    }
  }

  /* Realtime */
  function wantGid(){ if (inRoom()) return R.mine.gid; if (R.pageGid && !document.hidden) return R.pageGid; return null; }
  function updateChannel(){ const g = wantGid(); if (g !== R.chGid || (g && !R.ch)) { disconnect(); if (g) connect(g); } else trackMe(); }
  function connect(gid){
    const c = cli(); if (!c || typeof c.channel !== "function") return;
    R.chGid = gid; R.chTriedPublic = false; R.chPublic = false; R.presence = new Map(); R.presenceOK = false; R.tracked = false;
    const mk = priv => {
      R.chPublic = !priv;
      const ch = c.channel("sbroom:" + gid, {config: priv ? {private: true, presence: {key: myId()}, broadcast: {self: false, ack: false}} : {private: false}});
      if (priv) {
        ch.on("presence", {event: "sync"}, () => { if (R.ch === ch) onPresence(ch); });
        ch.on("broadcast", {event: "cheer"}, m => { if (R.ch === ch) onCheer(m && m.payload); });
      }
      ch.on("postgres_changes", {event: "*", schema: "public", table: "study_rooms", filter: "group_id=eq." + gid}, p => { if (R.ch === ch) onRoomChange(gid, p); });
      ch.on("postgres_changes", {event: "*", schema: "public", table: "study_room_people", filter: "group_id=eq." + gid}, p => { if (R.ch === ch) onPeopleChange(gid, p); });
      try {
        ch.subscribe(status => {
          if (R.ch !== ch) return;
          if (status === "SUBSCRIBED") { R.chReady = true; R.tracked = false; trackMe(); }
          else if (status === "CHANNEL_ERROR" && priv && !R.chTriedPublic) {
            R.chTriedPublic = true; R.chReady = false; try { c.removeChannel(ch); } catch(e) {}
            R.ch = mk(false);
          } else if (status === "CLOSED" || status === "TIMED_OUT" || status === "CHANNEL_ERROR") { R.chReady = false; R.tracked = false; }
        });
      } catch(e) {}
      return ch;
    };
    R.ch = mk(true);
  }
  function disconnect(){
    const c = cli(), ch = R.ch;
    R.ch = null; R.chGid = null; R.chReady = false; R.tracked = false; R.presence = new Map(); R.presenceOK = false;
    if (ch) { try { if (R.trackedCh === ch && ch.untrack) ch.untrack(); } catch(e) {} try { c && c.removeChannel(ch); } catch(e) {} }
  }
  function presenceMeta(){
    const m = R.mine;
    return {n: myName(m.gid), g: str(m.goal, 80), r: m.rid, c: compMine(), t: Date.now()};
  }
  function trackMe(){
    const ch = R.ch; if (!ch || !R.chReady || R.chPublic || typeof ch.track !== "function") return;
    const want = inRoom() && R.chGid === R.mine.gid;
    if (want) { try { const p = ch.track(presenceMeta()); if (p && p.catch) p.catch(() => {}); R.tracked = true; R.trackedCh = ch; } catch(e) {} }
    else if (R.tracked) { try { ch.untrack(); } catch(e) {} R.tracked = false; }
  }
  function onPresence(ch){
    let st = {}; try { st = ch.presenceState() || {}; } catch(e) {}
    const gid = R.chGid, room = R.rooms[gid], map = new Map();
    Object.keys(st).forEach(k => {
      const metas = Array.isArray(st[k]) ? st[k] : []; const x = metas[metas.length - 1];
      if (!x || typeof x !== "object" || (room && x.r !== room.id)) return;
      map.set(str(k, 60), {n: str(x.n, 40) || "Classmate", g: str(x.g, 80), c: cleanComp(x.c)});
    });
    R.presence = map; R.presenceOK = true;
    if (room) rememberNames(room.id);
    drawSoon();
  }
  function onRoomChange(gid, p){
    const row = p && p.new && p.new.id ? p.new : null;
    if (!row || row.group_id !== gid) { if (p && p.eventType === "DELETE") loadRoomSoon(gid); return; }
    const was = R.rooms[gid];
    if (!was || was.id !== row.id) { R.people[row.id] = R.people[row.id] || []; R.presence = new Map(); }
    setRoom(gid, row);
    if (!was || was.id !== row.id) loadRoomSoon(gid);
    draw(); need();
  }
  function onPeopleChange(gid, p){
    const row = p && p.new && p.new.room_id ? p.new : null; if (!row || row.group_id !== gid) return;
    const list = R.people[row.room_id] = (R.people[row.room_id] || []).filter(x => x.user_id !== row.user_id);
    list.push(row);
    rememberNames(row.room_id);
    drawSoon();
  }
  let loadT = 0;
  function loadRoomSoon(gid){ clearTimeout(loadT); loadT = setTimeout(() => loadRoom(gid), 400); }

  /* Study Companion portraits (another module; used only if it's there) */
  function cleanComp(d){
    if (!d || typeof d !== "object" || Array.isArray(d)) return null;
    const o = {}; let n = 0;
    Object.keys(d).slice(0, 6).forEach(k => {
      const v = d[k], key = String(k).replace(/[^\w]/g, "").slice(0, 20); if (!key) return;
      if (typeof v === "string" && /^[\w-]{1,40}$/.test(v)) { o[key] = v; n++; }
      else if (typeof v === "number" && isFinite(v)) { o[key] = v; n++; }
      else if (typeof v === "boolean") { o[key] = v; n++; }
    });
    return n ? o : null;
  }
  function compMine(){
    const C = window.SBCOMP; if (!C) return null;
    try {
      let d = typeof C.mine === "function" ? C.mine() : typeof C.current === "function" ? C.current() : null;
      if (typeof d === "string") d = {id: d, w: typeof C.wearing === "function" ? C.wearing() || "" : ""};
      return cleanComp(d);
    } catch(e) { return null; }
  }
  function compHtml(desc, px){
    const C = window.SBCOMP; if (!C || !desc) return "";
    for (const f of ["portrait", "miniPortrait", "mini", "avatar"]) {
      if (typeof C[f] !== "function") continue;
      try { const h = C[f](desc, px); if (typeof h === "string" && h && h.length < 60000 && !/<\s*script|\son\w+=/i.test(h)) return h; } catch(e) {}
    }
    if (typeof C.rigSvg === "function" && typeof desc.id === "string") {
      try { const h = C.rigSvg(desc.id, Object.assign({prop: "book", look: [0, 0.8]}, typeof desc.w === "string" && desc.w ? {wear: desc.w} : {})); if (typeof h === "string" && h && h.length < 60000 && !/<\s*script|\son\w+=/i.test(h)) return h; } catch(e) {}
    }
    return "";
  }
  function avatar(p, px){
    const c = compHtml(p.c, px || 44);
    if (c) return `<span class="room-av is-comp" aria-hidden="true">${c}</span>`;
    return `<span class="room-av" style="--c:${esc(hueOf(p.id || p.n))}" aria-hidden="true">${esc(initials(p.n))}</span>`;
  }

  /* Who's in the room */
  function peopleNow(gid, room){
    const rows = R.people[room.id] || [], by = new Map();
    if (R.presenceOK && R.chGid === gid) R.presence.forEach((x, id) => by.set(id, {id, n: x.n, g: x.g, c: x.c}));
    else rows.filter(r => r.here && ts(r.seen_at) > now() - STALE_MS).forEach(r => by.set(r.user_id, {id: r.user_id, n: str(r.display_name, 40), g: str(r.goal, 80)}));
    if (inRoom(room.id)) by.set(myId(), {id: myId(), n: myName(gid), g: str(R.mine.goal, 80), c: compMine()});
    rows.forEach(r => { const x = by.get(r.user_id); if (x) { if (!x.n || x.n === "Classmate") x.n = str(r.display_name, 40) || x.n; if (!x.g && x.id !== myId()) x.g = str(r.goal, 80); } });
    const list = [...by.values()];
    list.forEach(x => { x.me = x.id === myId(); });
    return list.sort((a, b) => (b.me - a.me) || String(a.n).localeCompare(String(b.n)));
  }

  /* Drawing the room on the group page */
  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.4 1.6M9.5 2.8h5M12 2.8v2.7"/><path d="M4.2 6.2l1.6 1.4M19.8 6.2l-1.6 1.4"/></svg>';
  const R_DIAL = 52, C_DIAL = 2 * Math.PI * R_DIAL;
  function ensureSection(gid){
    const head = $("#grpHead"); if (!head) return null;
    let sec = $("#roomSec");
    const gd = $("#grpDetail");
    if (gd && gd.dataset.kind === "project") { if (sec) sec.remove(); return null; }
    if (sec && sec.dataset.gid !== gid) { sec.remove(); sec = null; }
    if (!sec) {
      sec = document.createElement("section");
      sec.id = "roomSec"; sec.className = "room-sec"; sec.dataset.gid = gid;
      sec.setAttribute("aria-label", "Study Together");
      sec.innerHTML = `<div class="room-body"></div><div class="room-floats" aria-hidden="true"></div>`;
    }
    const err = head.nextElementSibling && head.nextElementSibling.classList.contains("grp-err") ? head.nextElementSibling : null;
    const after = err || head;
    if (after.nextElementSibling !== sec) after.insertAdjacentElement("afterend", sec);
    return sec;
  }
  let drawT = 0;
  function drawSoon(){ if (drawT) return; drawT = setTimeout(() => { drawT = 0; draw(); }, 120); }
  function draw(){
    updatePill();
    const gid = R.pageGid; if (!gid) return;
    const sec = ensureSection(gid); if (!sec) return;
    const body = $(".room-body", sec);
    const inp = $("#roomGoalIn", sec), had = inp && document.activeElement === inp, pos = inp ? inp.selectionStart : 0;
    const html = sectionHtml(gid);
    if (body._sig === html) return;
    body._sig = html;
    body.innerHTML = html;
    sec.className = "room-sec " + (body.firstElementChild ? body.firstElementChild.dataset.state || "" : "");
    const ni = $("#roomGoalIn", sec);
    if (ni) { ni.value = R.draft[gid] || ""; if (had) { ni.focus(); try { ni.setSelectionRange(pos, pos); } catch(e) {} } }
    paint();
  }
  function sectionHtml(gid){
    if (R.setup) return `<div class="room-card" data-state="is-setup"><div class="room-idle">${`<span class="room-ic">${ICON}</span>`}<div class="room-idle-txt"><b>Study Together</b><span class="mini">Focus at the same time as your group. ${esc(srvSetup("It", "rooms.sql"))}</span></div><button class="btn small" data-act="room-retry">Try Again</button></div></div>`;
    const room = R.rooms[gid], m = R.mine;
    if (m && m.done && m.gid === gid && m.moment && now() < m.moment.endAt + MOMENT_MS) return momentHtml(gid, m, room);
    if (!R.loaded[gid] && !room) return `<div class="room-card" data-state="is-idle"><div class="room-idle"><span class="room-ic">${ICON}</span><div class="room-idle-txt"><b>Study Together</b><span class="mini"><span class="ai-spin" aria-hidden="true"></span> Checking for a session…</span></div></div></div>`;
    if (room && isLive(room)) return inRoom(room.id) ? roomHtml(gid, room) : liveHtml(gid, room);
    const err = R.err[gid] ? `<p class="room-err" role="alert">${esc(R.err[gid])} <button class="link-btn" data-act="room-retry">Try Again</button></p>` : "";
    return `<div class="room-card" data-state="is-idle"><div class="room-idle"><span class="room-ic">${ICON}</span>
      <div class="room-idle-txt"><b>Study Together</b><span class="mini">Start a focus session and anyone in the group can join from anywhere.</span></div>
      <button class="btn primary small" data-act="room-start">Start a Session</button></div>${err}</div>`;
  }
  function peopleHtml(list, big){
    if (!list.length) return `<p class="room-none">Nobody's in the room right now.</p>`;
    const shown = big ? list : list.slice(0, 8);
    return `<ul class="room-people${big ? " big" : ""}">${shown.map(p => `<li class="room-person${p.me ? " is-me" : ""}">${avatar(p, big ? 44 : 32)}<span class="room-pn"><b>${esc(p.n)}${p.me ? ` <span class="mini">(You)</span>` : ""}</b>${big && p.g ? `<span class="room-pg">${esc(p.g)}</span>` : ""}</span></li>`).join("")}${list.length > shown.length ? `<li class="room-person more"><span class="room-av more">+${list.length - shown.length}</span></li>` : ""}</ul>`;
  }
  function liveHtml(gid, room){
    const list = peopleNow(gid, room), lim = limitsFor(gid), full = list.length >= lim.people;
    const m = R.mine, again = m && m.rid === room.id && !m.done && m.segs.length;
    const starter = room.started_by === myId() ? "you" : esc(room.starter_name || "a classmate");
    return `<div class="room-card is-live" data-state="is-live">
      <div class="room-top"><span class="room-dot" aria-hidden="true"></span><b>Studying Now</b><span class="mini">${esc(minLabel(room.minutes))} session started by ${starter}</span><span class="spacer"></span><span class="room-left-sm"><b data-room-left="${esc(gid)}" role="timer" aria-live="off">${esc(fmtClock(Math.max(0, ts(room.ends_at) - now())))}</b> left</span></div>
      ${room.goal ? `<p class="room-goal"><span class="mini">Goal</span> ${esc(room.goal)}</p>` : ""}
      ${peopleHtml(list, false)}
      <div class="room-join">
        <input type="text" id="roomGoalIn" maxlength="80" aria-label="Your goal for this session (optional)" placeholder="Your goal (optional), like Biology chapter 5" autocomplete="off">
        <button class="btn primary" data-act="room-join" data-id="${esc(room.id)}" ${full ? "disabled" : ""}>${again ? "Rejoin" : "Join"}</button>
      </div>
      <p class="room-seats mini">${full ? `The room is full (${lim.people} people).${lim.paywall && !lim.pro ? " The group owner can go Pro for rooms of up to " + LIMITS.pro.people + "." : ""}` : `${plural(list.length, "person", "people")} studying · room for ${lim.people}`}</p>
    </div>`;
  }
  function roomHtml(gid, room){
    const list = peopleNow(gid, room), m = R.mine, g = R.groups[gid];
    const canEnd = room.started_by === myId() || (g && g.owner_id === myId());
    const left = Math.max(0, ts(room.ends_at) - now()), total = Math.max(1, ts(room.ends_at) - ts(room.started_at));
    return `<div class="room-card is-in" data-state="is-in">
      <div class="room-main">
        <div class="room-dial" data-room-dial="${esc(gid)}"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="${R_DIAL}" class="track"/><circle cx="60" cy="60" r="${R_DIAL}" class="bar" style="stroke-dasharray:${C_DIAL};stroke-dashoffset:${C_DIAL * (1 - left / total)}"/></svg>
          <div class="room-read"><span class="room-time" data-room-left="${esc(gid)}" role="timer" aria-live="off">${esc(fmtClock(left))}</span><span class="room-lbl">Focusing Together</span></div></div>
        <div class="room-side">
          <p class="room-title"><b>Study Together</b><span class="mini">${esc(minLabel(room.minutes))} · started by ${room.started_by === myId() ? "you" : esc(room.starter_name || "a classmate")}</span></p>
          ${m.goal ? `<p class="room-goal"><span class="mini">Your Goal</span> ${esc(m.goal)}</p>` : ""}
          ${peopleHtml(list, true)}
        </div>
      </div>
      <div class="room-cheers" role="group" aria-label="Send a cheer to the room">${CHEERS.map(([k, e, l]) => `<button class="room-cheer" data-act="room-cheer" data-id="${k}" aria-label="Send a cheer: ${esc(l)}" title="${esc(l)}"><span aria-hidden="true">${e}</span></button>`).join("")}</div>
      <div class="room-foot"><button class="btn small" data-act="room-goal">${m.goal ? "Change My Goal" : "Add a Goal"}</button><span class="spacer"></span>${canEnd ? `<button class="link-btn room-end" data-act="room-end" data-id="${esc(room.id)}">End for Everyone</button>` : ""}<button class="btn small" data-act="room-leave">Leave Room</button></div>
      <p class="room-note mini">You can switch tabs while you study. Your own Focus timer stays separate.</p>
    </div>`;
  }
  function momentHtml(gid, m, room){
    const mo = m.moment, others = Object.values(m.names || {}).filter(Boolean);
    const who = others.length ? joinNames(others.slice(0, 12).concat(others.length > 12 ? [`${others.length - 12} more`] : []).concat("you")) : "";
    const title = others.length ? `You All Focused ${plural(mo.total, "Minute")} Together` : `You Focused ${plural(mo.total, "Minute")}`;
    const next = room && isLive(room) && room.id !== m.rid ? room : null;
    const breakLeft = mo.endAt + BREAK_MS - now();
    const mine = mo.mine >= 1 ? (mo.recorded ? `Your ${plural(mo.mine, "minute")} ${mo.mine === 1 ? "is" : "are"} in your focus stats.` : `You focused ${plural(mo.mine, "minute")}.`) : `You were in the room for ${plural(mo.mine, "minute")}. Only 5 minutes or more counts toward your focus stats.`;
    return `<div class="room-card is-moment" data-state="is-moment">
      <div class="room-moment">
        <span class="room-spark" aria-hidden="true">✨</span>
        <h3>${esc(title)}</h3>
        ${who ? `<p class="room-names">${esc(who)}</p>` : ""}
        <p class="mini">${mo.early ? "The session was ended early. " : ""}${esc(mine)}</p>
        ${breakLeft > 0 ? `<p class="room-break">Short Break <b data-room-break="${esc(gid)}">${esc(fmtClock(breakLeft))}</b></p>` : `<p class="room-break">Break's over. Ready for another round?</p>`}
        ${next ? `<p class="mini">${esc(next.started_by === myId() ? "You" : next.starter_name || "Someone")} started another ${esc(minLabel(next.minutes))} round.</p>` : ""}
        <div class="row-actions"><button class="btn primary" data-act="room-again">${next ? "Join Next Round" : `Go Again (${esc(minLabel(m.minutes))})`}</button><button class="btn" data-act="room-done">Done</button></div>
      </div></div>`;
  }
  // Countdowns, the ring, the header pill and the tab title
  function paint(){
    $$("[data-room-left]").forEach(el => { const r = R.rooms[el.dataset.roomLeft]; if (r) el.textContent = fmtClock(Math.max(0, ts(r.ends_at) - now())); });
    $$("[data-room-dial] .bar").forEach(el => {
      const r = R.rooms[el.closest("[data-room-dial]").dataset.roomDial]; if (!r) return;
      const left = Math.max(0, ts(r.ends_at) - now()), total = Math.max(1, ts(r.ends_at) - ts(r.started_at));
      el.style.strokeDashoffset = String(C_DIAL * (1 - left / total));
    });
    $$("[data-room-break]").forEach(el => { const m = R.mine; if (m && m.moment) el.textContent = fmtClock(Math.max(0, m.moment.endAt + BREAK_MS - now())); });
    $$(".room-banner [data-live-left]").forEach(el => { const r = R.live[el.dataset.liveLeft]; if (r) el.textContent = Math.max(1, Math.ceil((ts(r.ends_at) - now()) / 60000)) + " min left"; });
    updatePill();
  }
  function updatePill(){
    const m = R.mine, on = inRoom() && !(ui.tab === "groups" && ui.grp === m.gid);
    const left = inRoom() ? fmtClock(Math.max(0, m.endsAt - now())) : "";
    let pill = $("#roomPill");
    if (on) {
      if (!pill) { pill = document.createElement("button"); pill.id = "roomPill"; pill.className = "room-pill"; pill.dataset.act = "room-open"; document.body.appendChild(pill); }
      const html = `${ICON}<span>${esc(left)}</span>`;
      if (pill.dataset.t !== left) { pill.innerHTML = html; pill.dataset.t = left; pill.setAttribute("aria-label", `Study Together, ${left} left. Open the room`); }
    } else if (pill) pill.remove();
    const nb = $('nav.tabs [data-tab="groups"]');
    if (nb) {
      let t = $(".room-navtime", nb);
      if (inRoom()) { if (!t) { t = document.createElement("span"); t.className = "room-navtime"; nb.appendChild(t); } t.textContent = left; }
      else if (t) t.remove();
    }
    let pr = false; try { pr = !!pomo.running; } catch(e) {}
    if (!pr) { const want = inRoom() ? `${left} Study Together · Studyboard` : "Studyboard"; if (document.title !== want && (inRoom() || / Study Together · /.test(document.title))) document.title = want; }
  }

  /* The clock that runs while something needs it */
  function need(){
    const m = R.mine, pageRoom = R.pageGid && R.rooms[R.pageGid];
    const want = (m && !m.done) || (m && m.done && m.moment && now() < m.moment.endAt + MOMENT_MS) || (pageRoom && isLive(pageRoom)) || Object.keys(R.live).length;
    if (want && !R.tickT) R.tickT = setInterval(tick, 1000);
    else if (!want && R.tickT) { clearInterval(R.tickT); R.tickT = 0; }
    const ping = inRoom();
    if (ping && !R.pingT) R.pingT = setInterval(() => { if (inRoom()) api.ping(R.mine.rid).catch(() => {}); }, PING_MS);
    else if (!ping && R.pingT) { clearInterval(R.pingT); R.pingT = 0; }
  }
  function tick(){
    const m = R.mine;
    if (m && !m.done) {
      if (now() >= m.endsAt) finish(false);
      else if (inRoom() && Date.now() - (m.savedAt || 0) > 15000) { m.seen = now(); m.savedAt = Date.now(); saveMine(); }
    }
    Object.keys(R.live).forEach(g => { if (!isLive(R.live[g])) { delete R.live[g]; if (ui.tab === "groups" && !ui.grp) decorateList(); } });
    const pr = R.pageGid && R.rooms[R.pageGid];
    if (pr && R.pageGid && $("#roomSec") && $("#roomSec").className.includes("is-live") && !isLive(pr)) draw();
    if (m && m.done && m.moment && now() > m.moment.endAt + BREAK_MS && !m.moment.breakDone) { m.moment.breakDone = 1; saveMine(); draw(); }
    if (m && m.done && m.moment && now() > m.moment.endAt + MOMENT_MS && !m.moment.gone) { m.moment.gone = 1; draw(); }
    if (!document.hidden) paint();
    need();
  }

  /* Joining, leaving, finishing */
  function enter(room, goal){
    const gid = room.group_id, g = R.groups[gid];
    const t = now();
    const m = R.mine && R.mine.rid === room.id && !R.mine.done ? R.mine
      : {rid: room.id, gid, gname: str(g && g.name, 80), minutes: Number(room.minutes) || 25, startedAt: ts(room.started_at), endsAt: ts(room.ends_at), goal: "", segs: [], names: {}, done: 0};
    if (goal != null) m.goal = str(goal, 80);
    const last = m.segs[m.segs.length - 1];
    if (!last || last[1]) m.segs.push([!m.segs.length && room.started_by === myId() ? m.startedAt : Math.max(t, m.startedAt), 0]);
    m.seen = t; m.savedAt = Date.now();
    R.mine = m; saveMine();
    setRoom(gid, room);
    rememberNames(room.id);
    updateChannel(); trackMe(); need(); draw();
    try { fire("room", {type: "join", gid, endAt: m.endsAt - R.offset, minutes: m.minutes}); } catch(e) {}
  }
  // One session at a time
  function switchOk(gid, rid){
    const m = R.mine; if (!m || m.done || m.rid === rid) return true;
    if (inRoom()) { toast(`You're in a session in ${m.gname || "another group"}. Leave that room first.`); return false; }
    m.endsAt = Math.min(m.endsAt, now()); finish(true); R.mine = null; saveMine();
    return true;
  }
  async function startSession(gid, minutes, goal, btn){
    if (R.busy || !switchOk(gid, null)) return; R.busy = true; if (btn) { btn.disabled = true; btn.classList.add("busy"); }
    try {
      await syncClock(true);
      const room = await api.start(gid, minutes, goal);
      if (!room) throw new Error("Couldn't start the session. Try again.");
      R.people[room.id] = [{room_id: room.id, group_id: gid, user_id: myId(), display_name: myName(gid), goal: str(goal, 80), here: true, seen_at: new Date(now()).toISOString()}];
      if (R.mine && R.mine.done) R.mine = null;
      if (dlg.open) dlg.close();
      enter(room, goal);
      markSeen(room.id);
      toast(`Session started. Your group can join for the next ${minLabel(room.minutes)}.`);
    } catch(e) {
      if (btn) { btn.disabled = false; btn.classList.remove("busy"); }
      if (e.kind === "BUSY") { if (dlg.open) dlg.close(); loadRoom(gid); }
      if (e.setup) { R.setup = true; draw(); }
      toast(e.message);
    }
    R.busy = false;
  }
  async function joinSession(room, goal, btn){
    if (R.busy || !switchOk(room.group_id, room.id)) return; R.busy = true; if (btn) { btn.disabled = true; btn.classList.add("busy"); }
    try {
      await syncClock(true);
      const row = await api.join(room.id, goal == null ? null : goal) || room;
      if (R.mine && R.mine.done) R.mine = null;
      enter(row, goal);
      delete R.draft[room.group_id];
      loadRoomSoon(room.group_id);
    } catch(e) {
      if (btn) { btn.disabled = false; btn.classList.remove("busy"); }
      if (e.kind === "GONE") loadRoom(room.group_id);
      toast(e.message);
    }
    R.busy = false;
  }
  function leave(){
    const m = R.mine; if (!inRoom()) return;
    lastSeg()[1] = Math.max(lastSeg()[0], now()); m.seen = now(); saveMine();
    trackMe();
    api.leave(m.rid).catch(() => {});
    const mine = Math.floor(focusedMs(m, now()) / 60000);
    toast(`You left the room. You can rejoin until it ends${mine >= 1 ? ", and your " + plural(mine, "minute") + " so far will count" : ""}.`);
    updateChannel(); need(); draw();
    try { fire("room", {type: "leave", gid: m.gid}); } catch(e) {}
  }
  // Time's up (or the session was ended early)
  function finish(quiet){
    const m = R.mine; if (!m || m.done) return;
    const end = Math.min(m.endsAt, now());
    const last = lastSeg();
    if (last && !last[1]) last[1] = quiet ? Math.max(last[0], Math.min(end, m.seen || end)) : end;
    const mins = Math.floor(focusedMs(m, end) / 60000);
    let rec = false;
    if (mins >= 1 && !recorded(m.rid)) {
      markRecorded(m.rid);
      try { if (typeof SBSTATS !== "undefined" && SBSTATS) SBSTATS.addFocus(mins, "room"); } catch(e) { console.warn(e); }
      rec = true;
    } else if (mins >= 1) rec = true;
    rememberNames(m.rid);
    const early = end < m.startedAt + m.minutes * 60000 - 1000;
    const total = early ? Math.max(0, Math.floor((end - m.startedAt) / 60000)) : m.minutes;
    m.done = 1;
    m.moment = {total, mine: mins, recorded: rec, endAt: end, early: !!early};
    saveMine();
    trackMe();
    try { fire("room", {type: "end", gid: m.gid, minutes: mins, total}); } catch(e) {}
    updateChannel(); need(); draw();
    if (quiet) return;
    const others = Object.values(m.names || {}).length;
    const msg = `${others ? `You all focused ${plural(total, "minute")} together` : `You focused ${plural(total, "minute")}`} in ${m.gname || "your study group"}.`;
    const onPage = ui.tab === "groups" && ui.grp === m.gid && !document.hidden;
    if (document.hidden) R.pendingToast = msg;
    else if (!onPage) toast(msg, null, {label: "Open", fn: () => openGroupPage(m.gid)});
  }
  // After a reload or reopening the app
  function resume(){
    const m = R.mine = loadMine();
    if (!m) return;
    if (m.done) { if (!m.moment || now() > m.moment.endAt + MOMENT_MS) { R.mine = null; saveMine(); } return; }
    if (now() >= m.endsAt) { finish(true); return; }
    const last = lastSeg();
    if (last && !last[1] && now() - (m.seen || 0) > 3 * 60000) { last[1] = Math.max(last[0], m.seen || last[0]); saveMine(); }
    if (inRoom()) {
      api.join(m.rid, null).then(row => { if (row) setRoom(m.gid, row); draw(); }).catch(e => { if (e.kind === "GONE") { m.endsAt = Math.min(m.endsAt, now()); saveMine(); finish(false); } });
      syncClock(true);
    }
    updateChannel(); need();
  }

  /* Cheers */
  function sendCheer(k){
    if (!CHEER[k] || !inRoom()) return;
    if (Date.now() - R.lastCheer < 1200) return;
    R.lastCheer = Date.now();
    const payload = {k, n: myName(R.mine.gid), u: myId(), r: R.mine.rid};
    if (R.ch && !R.chPublic && typeof R.ch.send === "function") { try { const p = R.ch.send({type: "broadcast", event: "cheer", payload}); if (p && p.catch) p.catch(() => {}); } catch(e) {} }
    floatCheer(k, "You");
  }
  const cheerLog = [];
  function onCheer(p){
    if (!p || typeof p !== "object" || !CHEER[p.k] || p.u === myId()) return;
    const room = R.rooms[R.chGid]; if (room && p.r && p.r !== room.id) return;
    const t = Date.now(); while (cheerLog.length && t - cheerLog[0] > 3000) cheerLog.shift();
    if (cheerLog.length >= 8) return; cheerLog.push(t);
    floatCheer(p.k, str(p.n, 40) || "Classmate");
  }
  function floatCheer(k, who){
    const layer = $("#roomSec .room-floats"); if (!layer || document.hidden || !$("#roomSec .room-card.is-in, #roomSec .room-card.is-live")) return;
    if (layer.childElementCount > 10) layer.firstElementChild.remove();
    const el = document.createElement("span");
    el.className = "room-float" + (reduceMotion() ? " still" : "");
    el.style.setProperty("--x", (8 + Math.random() * 78).toFixed(1) + "%");
    el.style.setProperty("--dx", ((Math.random() - 0.5) * 50).toFixed(0) + "px");
    el.innerHTML = `<span class="e">${CHEER[k][1]}</span><small>${esc(who)}</small>`;
    layer.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  /* Sheets */
  function startSheet(gid){
    const g = R.groups[gid] || {}, lim = limitsFor(gid), ownerMe = g.owner_id === myId();
    const locked = n => n > lim.minutes;
    const proNote = lim.paywall && !lim.pro;
    const opt = (v, label, on) => `<label class="${locked(v) ? "is-locked" : ""}"><input type="radio" name="len" value="${v}" ${on ? "checked" : ""} ${locked(v) ? "disabled" : ""}><span>${esc(label)}${locked(v) ? " " + PRO_BADGE : ""}</span></label>`;
    const def = (R.mine && R.mine.minutes && !locked(R.mine.minutes) && LENGTHS.includes(R.mine.minutes)) ? R.mine.minutes : 25;
    openSheet(`<form class="sheet room-sheet">${head("Start a Session")}<div class="sheet-body">
      <p style="margin:0">Everyone in <b>${esc(g.name || "the group")}</b> who has Studyboard open gets a gentle note, and can join any time before it ends.</p>
      <fieldset><legend>Length</legend><div class="seg room-lens">${LENGTHS.map(v => opt(v, v + " Min", v === def)).join("")}<label><input type="radio" name="len" value="custom"><span>Custom</span></label></div></fieldset>
      <label class="f" id="roomCustomL" hidden><span class="lh">Minutes</span><input type="number" name="custom" min="5" max="${lim.minutes}" step="5" value="${Math.min(45, lim.minutes)}" inputmode="numeric"></label>
      <label class="f"><span class="lh">Your Goal <span class="hint">optional</span></span><input type="text" name="goal" maxlength="80" value="${esc(R.mine && R.mine.goal || "")}" placeholder="e.g. Biology chapter 5" autocomplete="off"></label>
      <p class="mini room-lim" style="margin:0">Rooms in this group hold up to ${plural(lim.people, "person", "people")} for up to ${esc(minLabel(lim.minutes))}.${proNote ? (ownerMe ? ` With Pro, your rooms hold ${LIMITS.pro.people} people for up to ${minLabel(LIMITS.pro.minutes)}. <button type="button" class="link-btn" data-act="room-pro">See Pro</button>` : ` Pro groups get rooms of ${LIMITS.pro.people} for up to ${minLabel(LIMITS.pro.minutes)}. It follows the group owner's plan.`) : ""}</p>
    </div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit id="roomGo">Start Session</button></div></form>`, fd => {
      const v = String(fd.get("len") || "25");
      let min = v === "custom" ? Math.round(Number(fd.get("custom"))) : Number(v);
      if (!isFinite(min) || min < 5) { toast("Pick at least 5 minutes"); return false; }
      if (min > lim.minutes) { toast(`Sessions in this group can be up to ${minLabel(lim.minutes)}.`); return false; }
      startSession(gid, min, str(String(fd.get("goal") || "").trim(), 80), $("#roomGo"));
      return false;
    });
    const f = $("form.room-sheet", dlg);
    f.addEventListener("change", () => { const c = f.querySelector('input[name="len"]:checked'); $("#roomCustomL").hidden = !(c && c.value === "custom"); });
    $$(".room-lens .is-locked", f).forEach(l => l.addEventListener("click", e => { e.preventDefault(); if (ownerMe && typeof PLAN !== "undefined") PLAN.openSheet(`Study Together rooms of up to ${minLabel(LIMITS.pro.minutes)} are part of Studyboard Pro.`); else toast(`This group's rooms can be up to ${minLabel(lim.minutes)}. Longer rooms follow the group owner's plan.`); }));
  }
  function goalSheet(){
    const m = R.mine; if (!inRoom()) return;
    openSheet(`<form class="sheet">${head(m.goal ? "Change My Goal" : "Add a Goal")}<div class="sheet-body">
      <label class="f"><span class="lh">Your Goal</span><input type="text" name="goal" maxlength="80" value="${esc(m.goal || "")}" autofocus placeholder="e.g. Biology chapter 5" autocomplete="off"></label>
      <p class="mini" style="margin:0">Everyone in the room sees it next to your name.</p></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>Save</button></div></form>`, fd => {
      m.goal = str(String(fd.get("goal") || "").trim(), 80); saveMine();
      api.join(m.rid, m.goal).catch(() => {});
      R.tracked = false; trackMe(); draw();
    });
  }
  function openGroupPage(gid){
    if (dlg.open) dlg.close();
    ui.tab = "groups"; ui.grp = gid; render(); window.scrollTo(0, 0);
  }

  /* Actions */
  hook("act", (act, el, id) => {
    if (!act.startsWith("room-")) return false;
    const gid = R.pageGid;
    switch (act) {
      case "room-start": if (gid && online()) { if (!R.groups[gid]) loadRoom(gid); startSheet(gid); } return true;
      case "room-join": { const room = gid && R.rooms[gid]; if (!room || room.id !== id || !isLive(room)) { toast("That session has finished."); if (gid) loadRoom(gid); return true; }
        const inp = $("#roomGoalIn"); const goal = inp ? str(inp.value.trim(), 80) : "";
        const again = R.mine && R.mine.rid === room.id && !R.mine.done;
        joinSession(room, goal || (again ? R.mine.goal : ""), el); return true; }
      case "room-leave": leave(); return true;
      case "room-goal": goalSheet(); return true;
      case "room-cheer": sendCheer(id); return true;
      case "room-end": { const room = gid && R.rooms[gid]; if (!room) return true;
        confirmSheet("End for Everyone?", "The session stops now for everyone in the room. Everyone keeps the minutes they focused.", "End Session", async () => {
          try { await api.end(room.id); const r = Object.assign({}, room, {status: "ended", ends_at: new Date(now()).toISOString()}); setRoom(gid, r); tick(); draw(); } catch(e) { toast(e.message); }
        }); return true; }
      case "room-again": { const m = R.mine; if (!m) return true;
        const room = R.rooms[m.gid];
        if (room && isLive(room) && room.id !== m.rid) { joinSession(room, m.goal, el); return true; }
        if (m.minutes > limitsFor(m.gid).minutes) { startSheet(m.gid); return true; }
        startSession(m.gid, m.minutes, m.goal, el); return true; }
      case "room-done": if (R.mine && R.mine.done) { R.mine = null; saveMine(); } draw(); need(); return true;
      case "room-retry": if (gid) { R.setup = false; R.err[gid] = ""; R.loaded[gid] = false; draw(); loadRoom(gid); } return true;
      case "room-open": if (R.mine) openGroupPage(R.mine.gid); return true;
      case "room-go": openGroupPage(id); return true;
      case "room-pro": if (dlg.open) dlg.close(); if (typeof PLAN !== "undefined") PLAN.openSheet(`Study Together rooms of up to ${LIMITS.pro.people} people and ${minLabel(LIMITS.pro.minutes)} are part of Studyboard Pro.`); return true;
      case "room-notices": {
        state.settings = Object.assign({}, state.settings, {roomNotice: !noticesOn()}); saveSettings();
        updateNotice();
        toast(noticesOn() ? "You'll get a small note when someone in your groups starts a session." : "Study Together notes are off. You'll still see sessions on the Groups page.");
        const row = el && el.closest("button"); if (row) { const s = $(".sub", row); if (s) s.textContent = noticeSub(); }
        return true; }
    }
    return false;
  });
  document.addEventListener("input", e => { if (e.target && e.target.id === "roomGoalIn" && R.pageGid) R.draft[R.pageGid] = e.target.value; });
  document.addEventListener("keydown", e => {
    if (e.target && e.target.id === "roomGoalIn" && e.key === "Enter") { e.preventDefault(); const b = $('#roomSec [data-act="room-join"]'); if (b && !b.disabled) b.click(); }
  });

  /* Notices: a small banner on the Groups page and a gentle toast */
  const SEENK = "sb:roomSeen";
  const seen = rid => lsJSON(SEENK, []).includes(rid);
  function markSeen(rid){ ls(SEENK, JSON.stringify(lsJSON(SEENK, []).filter(x => x !== rid).concat(rid).slice(-40))); }
  function noticeFor(room){
    if (!room || !isLive(room) || seen(room.id)) return;
    markSeen(room.id);
    if (room.started_by === myId() || !noticesOn() || inRoom()) return;
    if (ui.tab === "groups" && ui.grp === room.group_id) return;
    const name = (R.groups[room.group_id] || {}).name || "your study group";
    const left = Math.max(1, Math.round((ts(room.ends_at) - now()) / 60000));
    const msg = `${str(room.starter_name, 40) || "A classmate"} started Study Together in ${name}. ${left} min left.`;
    if (document.hidden) R.pendingToast = msg; else toast(msg, null, {label: "Join", fn: () => openGroupPage(room.group_id)});
  }
  async function loadLive(force){
    if (!online() || R.liveBusy || R.setup || (!force && Date.now() - R.liveAt < 90000)) return;
    R.liveBusy = true; R.liveAt = Date.now();
    try {
      if (R.hasGroups === undefined) { const g = await api.inAnyGroup(); R.hasGroups = !!(g && g.length); }
      if (R.hasGroups) {
        await syncClock();
        const rows = (await api.live() || []).filter(isLive);
        const need = rows.map(r => r.group_id).filter(g => !R.groups[g]);
        if (need.length) { try { (await api.groupNames(need) || []).forEach(g => { R.groups[g.id] = Object.assign({}, R.groups[g.id], g); }); } catch(e) {} }
        const fresh = {}; rows.forEach(r => { fresh[r.group_id] = r; });
        rows.forEach(r => { if (!R.rooms[r.group_id] || R.rooms[r.group_id].id !== r.id) setRoom(r.group_id, r); });
        R.live = fresh;
        rows.forEach(noticeFor);
      } else R.live = {};
    } catch(e) { if (e.setup) R.setup = true; }
    R.liveBusy = false;
    updateNotice(); need();
    if (ui.tab === "groups" && !ui.grp) decorateList();
  }
  function updateNotice(){
    const c = cli();
    const want = online() && !document.hidden && !R.setup && noticesOn() && R.hasGroups === true && c && typeof c.channel === "function";
    if (want && !R.nch) {
      const ch = R.nch = c.channel("sbroom-notice-" + myId() + "-" + uid());
      ch.on("postgres_changes", {event: "INSERT", schema: "public", table: "study_rooms"}, p => {
        const row = p && p.new; if (!row || !row.id) return;
        R.live[row.group_id] = row; if (!R.rooms[row.group_id] || R.rooms[row.group_id].id !== row.id) setRoom(row.group_id, row);
        const go = () => { noticeFor(row); if (ui.tab === "groups" && !ui.grp) decorateList(); need(); };
        if (R.groups[row.group_id]) go(); else api.group(row.group_id).then(g => { if (g) R.groups[g.id] = Object.assign({}, R.groups[g.id], g); go(); }).catch(go);
      });
      try { ch.subscribe(); } catch(e) {}
    } else if (!want && R.nch) { try { c && c.removeChannel(R.nch); } catch(e) {} R.nch = null; }
  }
  function decorateList(){
    const v = $("#view"); if (!v || ui.tab !== "groups" || ui.grp) return;
    $$(".room-banner", v).forEach(x => x.remove());
    $$(".room-live-pill", v).forEach(x => x.remove());
    const rooms = Object.values(R.live).filter(isLive);
    if (!rooms.length) return;
    const html = rooms.slice(0, 3).map(r => {
      const g = R.groups[r.group_id] || {}, mine = inRoom(r.id);
      return `<div class="room-banner" data-gid="${esc(r.group_id)}"><span class="room-dot" aria-hidden="true"></span>
        <span class="room-banner-txt"><b>${esc(r.started_by === myId() ? "You" : r.starter_name || "A classmate")}</b> ${r.started_by === myId() ? "are" : "is"} studying in <b>${esc(g.name || "a group")}</b><span class="mini"> · <span data-live-left="${esc(r.group_id)}">${Math.max(1, Math.ceil((ts(r.ends_at) - now()) / 60000))} min left</span>${r.goal ? " · " + esc(r.goal) : ""}</span></span>
        <button class="btn small ${mine ? "" : "primary"}" data-act="room-go" data-id="${esc(r.group_id)}">${mine ? "Open Room" : "Join"}</button></div>`;
    }).join("");
    const anchor = $(".grp-intro", v);
    if (anchor) anchor.insertAdjacentHTML("afterend", `<div class="room-banners">${html}</div>`);
    rooms.forEach(r => { const card = $(`.grp-main[data-id="${CSS.escape(r.group_id)}"] .grp-meta`, v); if (card) card.insertAdjacentHTML("afterend", `<span class="room-live-pill"><span class="room-dot" aria-hidden="true"></span>Studying Now</span>`); });
    $$(".room-banners", v).slice(1).forEach(x => x.remove());
  }

  /* Hooks into the rest of the app */
  function checkUser(){
    const id = online() ? myId() : "";
    if (R.uid === id) return;
    disconnect();
    if (R.nch) { try { const c = cli(); c && c.removeChannel(R.nch); } catch(e) {} R.nch = null; }
    Object.assign(R, {uid: id, rooms: {}, people: {}, groups: {}, members: {}, limits: {}, err: {}, setup: false, loading: {}, loaded: {}, loadedAt: {}, live: {}, liveAt: 0, hasGroups: undefined, draft: {}, mine: null, pendingToast: null});
    if (id) resume();
    need(); updatePill();
  }
  hook("render", tab => {
    checkUser();
    const gid = tab === "groups" && ui.grp && online() && $("#grpDetail") ? ui.grp : null;
    if (R.pageGid !== gid) { R.pageGid = gid; if (gid && R.loadedAt[gid] && Date.now() - R.loadedAt[gid] > 30000) R.loaded[gid] = false; }
    if (gid) { draw(); if (!R.loaded[gid] && !R.loading[gid]) loadRoom(gid); }
    if (tab === "groups" && online()) {
      if (R.hasGroups === false) R.hasGroups = undefined;
      if (!ui.grp) { decorateList(); loadLive(false); }
    }
    updateChannel(); updatePill(); need();
  });
  function noticeSub(){ return noticesOn() ? "On: a small note when someone in your groups starts a focus session" : "Off: sessions still show on the Groups page"; }
  hook("menu", () => online() ? `<button data-act="room-notices" data-group="school"><span>Study Together Notes<span class="sub">${esc(noticeSub())}</span></span></button>` : "");
  hook("boot", () => {
    checkUser();
    setTimeout(() => loadLive(true), 2500);
    setInterval(() => { checkUser(); if (online() && !document.hidden && R.hasGroups === undefined) loadLive(true); else updateNotice(); }, 60000);
  });
  document.addEventListener("visibilitychange", () => {
    if (!online()) return;
    updateChannel(); updateNotice();
    if (!document.hidden) {
      if (R.pendingToast) { const t = R.pendingToast; R.pendingToast = null; const m = R.mine; setTimeout(() => toast(t, null, m && m.gid && !(ui.tab === "groups" && ui.grp === m.gid) ? {label: "Open", fn: () => openGroupPage(m.gid)} : null), 500); }
      tick(); syncClock(); loadLive(false);
      if (R.pageGid && Date.now() - (R.loadedAt[R.pageGid] || 0) > 60000) loadRoom(R.pageGid);
    }
  });
  window.addEventListener("pagehide", () => { if (inRoom()) { R.mine.seen = now(); saveMine(); } });

  // For tests and other modules (read-only view)
  window.SBROOMS = {state: () => ({mine: R.mine ? JSON.parse(JSON.stringify(R.mine)) : null, offset: R.offset, channel: R.chGid, notice: !!R.nch, live: Object.keys(R.live), presence: [...R.presence.keys()], focus: typeof SBSTATS !== "undefined" && SBSTATS ? SBSTATS.focusMinutes() : null}), inRoom: () => inRoom()};
})();


