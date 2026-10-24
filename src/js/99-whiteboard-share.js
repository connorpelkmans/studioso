/* ===== module: 99-whiteboard-share.js ===== */
/* Sharing whiteboards (free) */
(() => {
  const W = window.SBWB; if (!W) return;
  const G = () => (window.SBGROUPS && SBGROUPS.share) || null;
  const online = () => { const g = G(); return !!(g && g.online()); };
  const cli = () => G().cli();
  const me = () => G().myId();
  const q = async p => { const r = await p; if (r && r.error) throw r.error; return r ? r.data : null; };
  const cut = (s, n) => String(s == null ? "" : s).slice(0, n);
  const K_SEQ = "studyboard:wbSeq", TAG = uid();
  const live = n => (n && n.wb && n.wb.g) || null;

  /* Pictures travel as small images inside the board */
  const PIC = new Map();
  const loadImg = u => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = u; });
  async function picData(it){
    if (it.src) return it.src;
    if (!it.f) return null;
    if (PIC.has(it.f)) return PIC.get(it.f);
    const f = state.files[it.f]; if (!f || !f.revs || !f.revs.length) return null;
    try {
      const r = curRev(f), io = W.pictures && W.pictures.IO, b = await (io ? io.bytes(r.assetId) : assetBytes(r.assetId));
      const u = URL.createObjectURL(new Blob([b], {type: r.type || "image/png"})), im = await loadImg(u); URL.revokeObjectURL(u);
      for (const side of [900, 640, 420]) {
        const k = Math.min(1, side / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k)); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        let url = c.toDataURL("image/webp", 0.8); if (!/^data:image\/webp/.test(url)) url = c.toDataURL("image/png");
        if (url.length < 380000) { PIC.set(it.f, url); return url; }
      }
    } catch (e) {}
    return null;
  }
  async function prepPictures(n){ await Promise.all(((n && n.wbItems) || []).filter(it => it.k === "i").map(picData)); }
  const embedded = it => it.k !== "i" ? it : (it.src || PIC.get(it.f)) ? Object.assign({}, it, {src: it.src || PIC.get(it.f), f: undefined}) : null;

  /* Share a Copy (a link) */
  function shareSrc(id, g){
    const n = state.notes[id]; if (!n || !n.wb) return null;
    const ink = n.wbInk || [], all = (n.wbItems || []).map(embedded).filter(Boolean);
    if (!ink.length && !all.length) return null;
    const c = courseOf(n.courseId);
    let data = JSON.parse(JSON.stringify({v: 1, type: "board", name: W.boardName(n), tpl: n.wb.tpl || "blank", ink, items: all, course: c ? {code: c.code || "", name: c.name || ""} : null}));
    if (JSON.stringify(data).length > 950000) data.items = all.filter(it => it.k !== "i");
    return {title: W.boardName(n), data, h: g ? g.hashOf(JSON.stringify(data)) : "",
      cur: () => (state.notes[id] || {}).shared,
      mark: m => { const cur = state.notes[id]; if (!cur) return; const nn = clone(cur); if (m) nn.shared = m; else delete nn.shared; applyChanges([{kind: "note", id, after: nn}], ""); }};
  }
  async function shareCopy(id){
    if (!window.SBSHARE) { toast("Sharing isn't available here."); return; }
    W.flush(); await prepPictures(state.notes[id]);
    SBSHARE.shareRef("board", id);
  }
  function shareView(row, h){
    const d = row.data && typeof row.data === "object" ? row.data : {};
    const tmp = {id: "shared-" + row.code, text: cut(row.name || d.name || "Whiteboard", 60), wb: {v: 1, tpl: d.tpl}, wbInk: d.ink, wbItems: d.items};
    normWbNote(tmp);
    if (!tmp.wbInk && !tmp.wbItems) { h.msgSheet("Shared Whiteboard", "That whiteboard couldn't be read. Ask the person to share it again."); return; }
    const course = d.course && typeof d.course === "object" ? {code: cut(d.course.code, 40), name: cut(d.course.name, 120)} : null;
    openSheet(`<div class="sheet sh-view">${head("Shared Whiteboard")}<div class="sheet-body">
      ${h.band(course, tmp.text, h.byLine(row).replace(/^ · /, "") || "A shared whiteboard")}
      <div class="wb-sh-pv"><img id="wbShImg" alt="${esc(tmp.text)}"></div>
      ${row.is_mine ? `<div class="grp-note">This is your own shared whiteboard.</div>` : ""}
      <p class="mini" style="margin:0">Saving it adds a copy to your Whiteboards that you can draw on.</p></div>
      <div class="sheet-foot">${h.reportBtn(row)}<span class="spacer"></span><button type="button" class="btn" data-act="close">Close</button><button type="button" class="btn primary" id="wbShSave">Save to My Whiteboards</button></div></div>`);
    W.renderBoard(tmp, {max: 900, full: true}).then(cv => { const im = $("#wbShImg"); if (im) im.src = cv.toDataURL("image/png"); }).catch(() => {});
    $("#wbShSave").addEventListener("click", () => {
      dlg.close();
      const g = G();
      W.create(tmp.text, tmp.wb.tpl, g ? g.matchCourse(course) : "", {wbInk: tmp.wbInk, wbItems: tmp.wbItems, sharedFrom: {code: row.code, by: cut(row.sharer_name, 80), at: Date.now()}});
      ui.tab = "notes"; render(); window.scrollTo(0, 0);
      h.saved(row.code); toast("Saved to your Whiteboards");
    });
  }

  /* Live group boards */
  const seqs = () => { try { return JSON.parse(localStorage.getItem(K_SEQ) || "{}") || {}; } catch (e) { return {}; } };
  const seqGet = bid => Number(seqs()[bid]) || 0;
  const seqSet = (bid, v) => { const m = seqs(); if ((Number(m[bid]) || 0) >= v) return; m[bid] = v; try { localStorage.setItem(K_SEQ, JSON.stringify(m)); } catch (e) {} };
  const goneList = () => (((state.settings || {}).wbGone) || []).filter(x => typeof x === "string");
  function addGone(bid){ const l = goneList(); if (l.includes(bid)) return; state.settings = Object.assign({}, state.settings, {wbGone: l.concat(bid).slice(-200)}); saveSettings(); }

  // What arrives from others goes through the same checks as anything saved (normWbNote)
  function clean(list){
    if (!Array.isArray(list)) return [];
    const ok = list.filter(c => c && (c.t === "s" || c.t === "i") && typeof c.id === "string" && /^[\w-]{1,40}$/.test(c.id)).slice(0, 200);
    const tmp = {wb: {v: 1}, wbInk: ok.filter(c => c.t === "s" && c.v).map(c => Object.assign({}, c.v, {id: c.id})), wbItems: ok.filter(c => c.t === "i" && c.v).map(c => Object.assign({}, c.v, {id: c.id}))};
    normWbNote(tmp);
    const S = new Map((tmp.wbInk || []).map(x => [x.id, x])), I = new Map((tmp.wbItems || []).map(x => [x.id, x]));
    return ok.map(c => !c.v ? {t: c.t, id: c.id, v: null} : (c.t === "s" ? S : I).has(c.id) ? {t: c.t, id: c.id, v: (c.t === "s" ? S : I).get(c.id)} : null).filter(Boolean);
  }
  function applyNote(nid, ch){
    if (!ch.length) return;
    if (W.applyRemote(nid, ch)) return;
    const n = state.notes[nid]; if (!n) return;
    const after = clone(n), ink = new Map((after.wbInk || []).map(s => [s.id, s])), its = new Map((after.wbItems || []).map(x => [x.id, x]));
    ch.forEach(c => { const m = c.t === "s" ? ink : its; if (c.v) m.set(c.id, c.v); else m.delete(c.id); });
    after.wbInk = [...ink.values()]; after.wbItems = [...its.values()]; after.updated = Date.now();
    applyChanges([{kind: "note", id: nid, after}], null);
  }
  async function fetchOps(bid, after){
    const out = []; let from = after;
    for (let k = 0; k < 60; k++) {
      const rows = (await q(cli().from("group_board_ops").select("id,user_id,ch,tag").eq("board_id", bid).gt("id", from).order("id").limit(500))) || [];
      out.push(...rows); if (rows.length < 500) break; from = rows[rows.length - 1].id;
    }
    return out;
  }
  let L = null;
  async function catchUp(nid, Lx){
    const g = live(state.notes[nid]); if (!g || !online()) return;
    const rows = await fetchOps(g.bid, seqGet(g.bid));
    let ch = [];
    rows.forEach(r => { if (r.tag === TAG || (Lx && (Lx.sent.has(r.id) || Lx.seen.has(r.id)))) return; if (Lx) Lx.seen.add(r.id); ch = ch.concat(clean(r.ch)); });
    applyNote(nid, ch);
    if (rows.length) seqSet(g.bid, rows[rows.length - 1].id);
  }
  function stop(){
    if (!L) return; const x = L; L = null;
    if (x.q.length) send(x);
    try { if (x.ch) cli().removeChannel(x.ch); } catch (e) {}
    chip();
  }
  function listen(nid){
    const n = state.notes[nid], g = live(n);
    if (L && L.nid === nid) return;
    stop(); if (!g || !online()) return;
    const x = L = {nid, bid: g.bid, gid: g.gid, ch: null, q: [], timer: 0, sent: new Set(), seen: new Set(), on: false};
    const c = cli();
    if (c && typeof c.channel === "function") {
      try {
        const ch = c.channel("sbwb-" + g.bid + "-" + uid());
        ch.on("postgres_changes", {event: "INSERT", schema: "public", table: "group_board_ops", filter: "board_id=eq." + g.bid}, p => {
          const r = p && p.new; if (!r || L !== x || r.tag === TAG || x.sent.has(r.id) || x.seen.has(r.id)) return;
          x.seen.add(r.id); applyNote(x.nid, clean(r.ch)); seqSet(x.bid, r.id);
        });
        ch.subscribe(st => { x.on = st === "SUBSCRIBED" || st === undefined; chip(); });
        x.ch = ch;
      } catch (e) {}
    }
    catchUp(nid, x).catch(() => {});
    addMe(g.bid, g.gid); access(g.bid);
    chip();
  }
  let errShown = 0;
  async function send(x){
    clearTimeout(x.timer); x.timer = 0;
    const last = new Map(); x.q.splice(0).forEach(c => last.set(c.t + c.id, c));
    let list = [...last.values()];
    list = await Promise.all(list.map(async c => {
      if (!(c.t === "i" && c.v && c.v.k === "i")) return c;
      const src = await picData(c.v); return src ? {t: c.t, id: c.id, v: Object.assign({}, c.v, {src, f: undefined})} : null;
    }));
    list = JSON.parse(JSON.stringify(list.filter(Boolean)));
    for (let i = 0; i < list.length;) {
      let n = Math.min(150, list.length - i), part = list.slice(i, i + n);
      while (n > 1 && JSON.stringify(part).length > 500000) { n = Math.ceil(n / 2); part = list.slice(i, i + n); }
      try {
        const rows = await q(cli().from("group_board_ops").insert({board_id: x.bid, group_id: x.gid, ch: part, tag: TAG}).select("id"));
        (Array.isArray(rows) ? rows : rows ? [rows] : []).forEach(r => { x.sent.add(r.id); seqSet(x.bid, r.id); });
      } catch (e) {
        x.q.unshift(...list.slice(i)); x.timer = setTimeout(() => send(x), 4000);
        if (Date.now() - errShown > 60000) { errShown = Date.now(); toast("The group board isn't getting your changes right now. They'll be sent when you're back online."); }
        return;
      }
      i += n;
    }
    previewSoon(x.nid);
  }
  W.onLive((t, id, v) => {
    const x = L; if (!x || W.curId() !== x.nid) return;
    x.q.push({t, id, v}); clearTimeout(x.timer); x.timer = setTimeout(() => send(x), 250);
  });

  /* Share With a Study Group */
  async function groupSheet(nid){
    const n = state.notes[nid]; if (!n) return;
    if (live(n)) { toast(`This board is already live with ${n.wb.g.gn || "a study group"}.`); return; }
    if (!online()) { toast("Sign in to share boards with a study group.", null, window.SBGUEST && SBGUEST.signUp ? {label: "Sign In", fn: () => SBGUEST.signUp()} : undefined); return; }
    openSheet(`<div class="sheet">${head("Share With a Study Group")}<div class="sheet-body"><p class="mini" style="margin:0" role="status">Loading your groups…</p></div></div>`);
    let groups = [];
    try { groups = (await q(cli().from("study_groups").select("id,name").order("created_at"))) || []; } catch (e) { if (dlg.open) openSheet(`<div class="sheet">${head("Share With a Study Group")}<div class="sheet-body"><p style="margin:0">${esc((e && e.message) || "Couldn't load your groups.")}</p></div></div>`); return; }
    if (!dlg.open) return;
    if (!groups.length) {
      openSheet(`<div class="sheet">${head("Share With a Study Group")}<div class="sheet-body"><p style="margin:0">Join or start a study group first. Then everyone in it can draw on this board with you, live.</p></div>
        <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Not Now</button><button type="button" class="btn primary" id="wbGoGroups">Study Groups</button></div></div>`);
      $("#wbGoGroups").addEventListener("click", () => { dlg.close(); ui.tab = "groups"; render(); window.scrollTo(0, 0); });
      return;
    }
    openSheet(`<form class="sheet">${head("Share With a Study Group")}<div class="sheet-body">
      <p style="margin:0">“${esc(W.boardName(n))}” shows up in the group's Whiteboards tab. Whoever adds it can draw on it with you, and what anyone draws or writes shows up for everyone as it happens.</p>
      <fieldset class="wb-grp-pick"><legend>Group</legend>${groups.map((g, i) => `<label class="mi-check"><input type="radio" name="gid" value="${esc(g.id)}"${i ? "" : " checked"}> ${esc(g.name)}</label>`).join("")}</fieldset>
      <p class="mini" style="margin:0">Each person's copy is their own: deleting yours doesn't delete anyone else's.</p></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="submit" class="btn primary" data-submit>Share</button></div></form>`, fd => {
      const gid = String(fd.get("gid") || ""), g = groups.find(x => x.id === gid); if (!g) return false;
      makeLive(nid, g.id, g.name); return true;
    });
  }
  async function makeLive(nid, gid, gname){
    W.flush();
    const n = state.notes[nid]; if (!n) return;
    let row;
    try { row = await q(cli().from("group_boards").insert({group_id: gid, name: W.boardName(n).slice(0, 60), tpl: n.wb.tpl || "blank"}).select().single()); }
    catch (e) { toast(/does not exist|schema cache/i.test(String(e && e.message)) ? "Live group boards need the newest supabase-groups.sql on the server." : ((e && e.message) || "Couldn't share the board. Try again.")); return; }
    if (!row || !row.id) { toast("Couldn't share the board. Try again."); return; }
    const cur = state.notes[nid]; if (!cur) return;
    const after = clone(cur); after.wb = Object.assign({}, after.wb, {g: {gid, bid: row.id, seq: 0, gn: cut(gname, 80)}});
    applyChanges([{kind: "note", id: nid, after}], "");
    listen(nid);
    if (L && L.nid === nid) {
      (after.wbInk || []).forEach(s => L.q.push({t: "s", id: s.id, v: s}));
      (after.wbItems || []).forEach(it => L.q.push({t: "i", id: it.id, v: it}));
      if (L.q.length) await send(L);
    }
    await addMe(row.id, gid); previewSoon(nid, true); GB.delete(gid);
    toast(`Shared with ${gname}. Everyone in the group can add it from the group's Whiteboards tab.`);
    render();
  }
  // A shared board joins your Whiteboards when you add it from the group
  async function addCopy(row, gname){
    const have = Object.values(state.notes || {}).find(n => live(n) && n.wb.g.bid === row.id); if (have) return have.id;
    const now = Date.now(), n = normNote({id: uid(), text: cut(row.name, 60) || "Group Whiteboard", wb: {v: 1, tpl: row.tpl, g: {gid: row.group_id, bid: row.id, seq: 0, gn: cut(gname || "your study group", 80)}}, courseId: "", board: "", created: now, updated: now});
    const gone = goneList(); if (gone.includes(row.id)) { state.settings = Object.assign({}, state.settings, {wbGone: gone.filter(x => x !== row.id)}); saveSettings(); }
    applyChanges([{kind: "note", id: n.id, after: n}], "");
    try { seqSet(row.id, 0); await catchUp(n.id, null); } catch (e) {}
    await addMe(row.id, row.group_id);
    return n.id;
  }
  // who has a board
  const ADDED = new Set();
  async function addMe(bid, gid){
    if (!online() || ADDED.has(bid)) return; ADDED.add(bid);
    try { await q(cli().from("group_board_people").upsert({board_id: bid, group_id: gid}, {onConflict: "board_id,user_id", ignoreDuplicates: true})); } catch (e) { ADDED.delete(bid); }
  }
  const ACC = new Map();
  async function access(bid, force){
    const c = ACC.get(bid); if (!online() || (!force && c && Date.now() - c.at < 30000)) return c;
    try { const rows = (await q(cli().from("group_board_people").select("user_id,added_at").eq("board_id", bid).order("added_at"))) || []; ACC.set(bid, {ids: rows.map(r => r.user_id), at: Date.now()}); chip(); }
    catch (e) {}
    return ACC.get(bid);
  }
  // a member's picture
  const faceOf = (gid, id, titled) => {
    const m = ((G() && G().members) ? G().members(gid) : []).find(x => x.id === id), nm = memberName(gid, id), real = nm === "You" ? (G() && G().myName && G().myName()) || "You" : nm;
    let h = ""; try { h = G() && G().avatar ? G().avatar(gid, id, real) : ""; } catch (e) {}
    if (h) return `<span class="wbg-face"${titled ? ` title="${esc(nm)}"` : ""}>${h}</span>`;
    return `<span class="wbg-av" style="--c:${esc((m && /^#[0-9A-F]{6}$/i.test(m.color || "")) ? m.color : "#7A8494")}"${titled ? ` title="${esc(nm)}"` : ""}>${esc(real.trim().charAt(0).toUpperCase() || "?")}</span>`; };
  const memberName = (gid, id) => { if (id === me()) return "You"; const m = ((G() && G().members) ? G().members(gid) : []).find(x => x.id === id); return (m && m.name) || "A member"; };
  const whoText = (gid, ids) => { const names = [...new Set(ids)].sort((a, b) => (b === me()) - (a === me())).map(id => memberName(gid, id)); return !names.length ? "Nobody has added it yet" : names.length <= 3 ? names.join(", ").replace(/, ([^,]*)$/, " and $1") + (names.length === 1 && names[0] !== "You" ? " has it" : " have it") : `${names.slice(0, 2).join(", ")} and ${names.length - 2} others have it`; };
  // a small picture of the board for the group's Whiteboards tab, kept fresh while people draw
  const PV = new Map();
  function previewSoon(nid, now){
    const n = state.notes[nid], g = live(n); if (!g || !online()) return;
    const last = PV.get(g.bid) || 0; if (!now && Date.now() - last < 20000) { if (!PV.has("t" + g.bid)) PV.set("t" + g.bid, setTimeout(() => { PV.delete("t" + g.bid); previewSoon(nid, true); }, 20000 - (Date.now() - last))); return; }
    PV.set(g.bid, Date.now());
    setTimeout(async () => {
      try {
        W.flush(); const pic = async dark => { const cv = await W.renderBoard(state.notes[nid] || n, {max: 520, dark}); let url = cv.toDataURL("image/jpeg", 0.72); if (url.length > 190000) url = cv.toDataURL("image/jpeg", 0.45); return url.length < 190000 ? url : null; };
        const url = await pic(false), dk = await pic(true); if (!url) return;
        try { await q(cli().rpc("group_board_preview", {p_board: g.bid, p_preview: url, p_dark: dk})); }
        catch (e) { await q(cli().rpc("group_board_preview", {p_board: g.bid, p_preview: url})); }
      } catch (e) {}
    }, 300);
  }

  /* The group's Whiteboards tab */
  const GB = new Map();
  async function loadGroup(gid, force){
    const c = GB.get(gid); if (!online() || (c && c.busy) || (!force && c && Date.now() - c.at < 15000)) return;
    const x = c || {rows: null, people: new Map(), at: 0}; x.busy = true; GB.set(gid, x);
    try {
      x.rows = (await q(cli().from("group_boards").select("*").eq("group_id", gid).eq("deleted", false).order("updated_at", {ascending: false}))) || [];
      const ppl = (await q(cli().from("group_board_people").select("board_id,user_id").eq("group_id", gid))) || [];
      x.people = new Map(); ppl.forEach(r => { if (!x.people.has(r.board_id)) x.people.set(r.board_id, []); x.people.get(r.board_id).push(r.user_id); });
      x.err = "";
    } catch (e) { x.err = /does not exist|schema cache/i.test(String(e && e.message)) ? "Group whiteboards need the newest supabase-groups.sql on the server." : "Couldn't load the group's whiteboards."; if (!x.rows) x.rows = []; }
    x.at = Date.now(); x.busy = false; fillPanes();
    if (G() && G().loadMembers && await G().loadMembers(gid)) fillPanes();
  }
  const okPv = v => typeof v === "string" && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v) && v.length < 200000;
  const pvOf = r => (W.dark && W.dark() && okPv(r.preview_dark)) ? r.preview_dark : r.preview;
  hook("wb-theme", () => fillPanes());
  const mineOf = bid => Object.values(state.notes || {}).find(n => live(n) && n.wb.g.bid === bid);
  function paneBody(gid){
    const c = GB.get(gid);
    if (!online()) return `<p class="empty mini">Sign in to share whiteboards with your group.</p>`;
    if (!c || !c.rows) return `<p class="empty mini" role="status">Loading the group's whiteboards…</p>`;
    if (c.err && !c.rows.length) return `<p class="empty mini">${esc(c.err)}</p>`;
    if (!c.rows.length) return `<p class="empty mini">No whiteboards here yet. Share one, and everyone in the group can add it and draw on it with you, live.</p>`;
    return `<div class="wbg-grid">${c.rows.map(r => {
      const mine = mineOf(r.id), ids = c.people.get(r.id) || [], who = whoText(gid, mine ? [me()].concat(ids) : ids);
      const dots = [...new Set(mine ? [me()].concat(ids) : ids)].slice(0, 5).map(id => { return faceOf(gid, id, true); }).join("");
      return `<div class="wbg-card">
        <button type="button" class="wbg-pv" data-act="grp-wb-open" data-id="${esc(r.id)}" data-g="${esc(gid)}" aria-label="${mine ? "Open" : "Add and open"} ${esc(r.name)}">${okPv(pvOf(r)) ? `<img src="${esc(pvOf(r))}" alt="">` : `<span class="wbg-ph">${esc(W.tplName ? W.tplName(r.tpl) : "Whiteboard")}</span>`}</button>
        <div class="wbg-meta"><b>${esc(r.name)}</b><span class="wbg-who"><span class="wbg-avs" aria-hidden="true">${dots}</span>${esc(who)}</span></div>
        <div class="wbg-acts">${mine ? `<button type="button" class="btn small" data-act="grp-wb-open" data-id="${esc(r.id)}" data-g="${esc(gid)}">Open</button>` : `<button type="button" class="btn small primary" data-act="grp-wb-add" data-id="${esc(r.id)}" data-g="${esc(gid)}">Add to My Whiteboards</button>`}</div>
      </div>`; }).join("")}</div>`;
  }
  function fillPanes(){ document.querySelectorAll(".grp-wbs[data-gid]").forEach(el => { const b = el.querySelector(".grp-wbs-body"); if (b) { const h = paneBody(el.dataset.gid); if (b.innerHTML !== h) b.innerHTML = h; } }); }
  hook("grp-boards", g => g && g.id ? `<section class="card grp-sec grp-wbs" data-gid="${esc(g.id)}"><div class="grp-wbs-head"><h3 class="fsec">Whiteboards</h3><button type="button" class="btn small" data-act="grp-wb-share" data-id="${esc(g.id)}">Share a Whiteboard</button></div>
    <p class="mini" style="margin:0 0 10px">Boards shared here are live: add one to your Whiteboards to draw on it with everyone.</p><div class="grp-wbs-body">${paneBody(g.id)}</div></section>` : "");
  async function openFromGroup(bid, gid, add){
    const have = mineOf(bid); if (have) { W.open(have.id); window.scrollTo(0, 0); return; }
    const c = GB.get(gid), row = c && c.rows && c.rows.find(r => r.id === bid); if (!row) return;
    const gname = ((G() && G().groups ? G().groups() : []).find(x => x.id === gid) || {}).name;
    const nid = await addCopy(row, gname);
    (c.people.get(bid) || c.people.set(bid, []).get(bid)).push(me()); fillPanes();
    toast(`“${cut(row.name, 40)}” is in your Whiteboards. Changes show up for everyone as they happen.`, null, add ? {label: "Open", fn: () => W.open(nid)} : undefined);
    if (!add) { W.open(nid); window.scrollTo(0, 0); }
  }
  function shareToGroupSheet(gid){
    const gname = ((G() && G().groups ? G().groups() : []).find(x => x.id === gid) || {}).name || "the group";
    const mine = W.boards().filter(n => !live(n));
    if (!mine.length) { toast("Make a whiteboard first (Notes > Whiteboard), then share it here."); return; }
    openSheet(`<form class="sheet">${head("Share a Whiteboard")}<div class="sheet-body">
      <p style="margin:0">Pick a board to share with ${esc(gname)}. It shows up in the group's Whiteboards tab, and whoever adds it can draw on it with you, live.</p>
      <fieldset class="wb-grp-pick"><legend>Board</legend>${mine.map((n, i) => `<label class="mi-check"><input type="radio" name="nid" value="${esc(n.id)}"${i ? "" : " checked"}> ${esc(W.boardName(n))}</label>`).join("")}</fieldset></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="submit" class="btn primary" data-submit>Share</button></div></form>`, fd => {
      const nid = String(fd.get("nid") || ""); if (!state.notes[nid]) return false;
      makeLive(nid, gid, gname).then(() => loadGroup(gid, true)); return true;
    });
  }
  // Deleting your copy of a group board
  hook("changed", (changes, inverse) => {
    changes.forEach((c, i) => { const was = inverse && inverse[i] && inverse[i].after; if (c.kind === "note" && c.after === null && live(was)) {
      addGone(was.wb.g.bid); ADDED.delete(was.wb.g.bid);
      if (online()) q(cli().from("group_board_people").delete().eq("board_id", was.wb.g.bid).eq("user_id", me())).catch(() => {}); } });
  });

  /* On the page */
  function chip(){
    const el = document.querySelector(".wb-livechip"); if (!el) return;
    el.classList.toggle("on", !!(L && L.on));
    const g = live(state.notes[W.curId()]), a = g && ACC.get(g.bid), n = el.querySelector(".wbl-n");
    if (n && a) { const k = new Set(a.ids.concat(me())).size; n.textContent = ` · ${k} ${k === 1 ? "person" : "people"}`; }
  }
  async function accessSheet(nid){
    const g = live(state.notes[nid]); if (!g) return;
    const body = a => { const ids = [...new Set(((a && a.ids) || []).concat(me()))].sort((x, y) => (y === me()) - (x === me()));
      return `<div class="wbg-from"><span class="wbg-from-t"><span class="mini">Shared from</span><b>${esc(g.gn || "your study group")}</b></span>${G() && G().openBoards ? `<button type="button" class="btn small" id="wbGoGroup">Go to Group</button>` : ""}</div>
      <p style="margin:0">Live: what anyone here draws or writes shows up for everyone as it happens.</p>
      <ul class="wbg-people">${ids.map(id => `<li>${faceOf(g.gid, id)}${esc(memberName(g.gid, id))}</li>`).join("")}</ul>
      <p class="mini" style="margin:0">Anyone else in the group can add it from the group's Whiteboards tab. Deleting your copy only removes yours.</p>`; };
    const fetch = () => Promise.all([access(g.bid, true), G() && G().loadMembers ? G().loadMembers(g.gid) : null]).then(r => r[0]).catch(() => ACC.get(g.bid));
    // Open once, with everything: cached people show at once, otherwise wait briefly for them
    if (accessSheet.busy) return; accessSheet.busy = true;
    let a = ACC.get(g.bid), html;
    const p = fetch(), haveM = G() && G().members && (G().members(g.gid) || []).length;
    if (!a || !haveM) a = await Promise.race([p, new Promise(r => setTimeout(() => r(ACC.get(g.bid)), 1500))]);
    accessSheet.busy = false;
    openSheet(`<div class="sheet">${head("Who Has This Board")}<div class="sheet-body">${html = body(a)}</div></div>`);
    const wire = () => { const go = $("#wbGoGroup", dlg); if (go) go.addEventListener("click", () => { W.flush(); G().openBoards(g.gid); }); };
    wire();
    // quietly refresh only if someone new turned up
    const fresh = await p; if (!dlg.open) return;
    const next = body(fresh); if (next !== html && $(".wbg-people", dlg)) { $(".sheet-body", dlg).innerHTML = next; wire(); }
  }
  hook("wb-head", id => {
    const g = live(state.notes[id]); if (!g) return "";
    const a = ACC.get(g.bid), k = a ? new Set(a.ids.concat(me())).size : 0;
    return `<button type="button" class="wb-livechip${L && L.nid === id && L.on ? " on" : ""}" data-act="wb-access" data-id="${esc(id)}" title="Who has this board"><span class="dot" aria-hidden="true"></span>Live with ${esc(g.gn || "your group")}<span class="wbl-n">${k ? ` · ${k} ${k === 1 ? "person" : "people"}` : ""}</span></button>`;
  });
  hook("wb-opt-acts", id => {
    const n = state.notes[id], g = live(n);
    return `<button type="button" class="btn" data-act="wb-share-copy" data-id="${esc(id)}" title="Share a copy by link">Share Link</button>`
      + (g ? "" : `<button type="button" class="btn" data-act="wb-share-group" data-id="${esc(id)}" title="Share with a study group, live">Share to Group</button>`);
  });
  hook("wb-export-acts", id => `<button type="button" class="btn" data-act="wb-share-copy" data-id="${esc(id)}">Share a Copy (Link)</button>`);
  hook("render", tab => {
    if (tab === "notes" && W.on()) { const id = W.curId(); if (id) listen(id); }
    else if (L) stop();
    if (tab === "groups") setTimeout(() => { fillPanes(); document.querySelectorAll(".grp-wbs[data-gid]").forEach(el => loadGroup(el.dataset.gid)); }, 0);
  });
  hook("act", (act, el, id) => {
    if (act === "wb-share-copy") { if (dlg.open) dlg.close(); shareCopy(id || W.curId()); return true; }
    if (act === "wb-share-group") { if (dlg.open) dlg.close(); groupSheet(id || W.curId()); return true; }
    if (act === "wb-access") { accessSheet(id || W.curId()); return true; }
    if (act === "grp-wb-open" || act === "grp-wb-add") { openFromGroup(id, el && el.dataset.g, act === "grp-wb-add"); return true; }
    if (act === "grp-wb-share") { shareToGroupSheet(id); return true; }
    return false;
  });
  Object.assign(W, {shareSrc, shareView, share: {discover: gid => loadGroup(gid, true), live: () => L, send: () => L && send(L), picData, access: bid => access(bid, true)}});

  const css = document.createElement("style");
  css.textContent = `
.wb-livechip{cursor:pointer;font:inherit}
.wb-livechip{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:999px;background:color-mix(in srgb,#178A4A 12%,var(--surface));color:#137240;font:700 .82rem var(--display);border:1px solid color-mix(in srgb,#178A4A 35%,transparent);white-space:nowrap}
html[data-theme=dark] .wb-livechip{color:#7FE3A6}
.wb-livechip .dot{width:8px;height:8px;border-radius:50%;background:#9AA4B1}
.wb-livechip.on .dot{background:#22B35E;box-shadow:0 0 0 3px rgba(34,179,94,.22)}
.wb-sh-pv{border-radius:10px;background:#FDFEFE;box-shadow:inset 0 0 0 1px var(--line);overflow:hidden;aspect-ratio:3/2;display:flex;align-items:center;justify-content:center}
.wb-sh-pv img{max-width:100%;max-height:100%;display:block}
.wb-sh-pv img:not([src]){display:none}
.wb-grp-pick{border:0;margin:0;padding:0;display:grid;gap:6px}
.wb-grp-pick legend{font-weight:600;margin-bottom:6px;padding:0}
.wb-livechip .wbl-n{font-weight:600;opacity:.85}
.grp-wbs-head{display:flex;align-items:center;gap:10px;margin-bottom:4px}.grp-wbs-head h3{flex:1;margin:0}
.wbg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.wbg-card{display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:14px;border:1px solid var(--line);background:var(--surface)}
.wbg-pv{position:relative;display:flex;align-items:center;justify-content:center;aspect-ratio:3/2;width:100%;min-width:0;min-height:0;padding:6px;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#FDFEFE;cursor:pointer;isolation:isolate}
.wbg-pv img{position:absolute;inset:6px;width:calc(100% - 12px);height:calc(100% - 12px);object-fit:contain;display:block}
.wbg-pv:hover,.wbg-pv:focus-visible{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent);outline:none}
.wbg-ph{font:700 .85rem var(--display);color:#9BA5B2}
.wbg-meta{display:flex;flex-direction:column;gap:3px;min-width:0}.wbg-meta b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wbg-who{display:flex;align-items:center;gap:6px;font-size:.8rem;color:var(--muted)}
.wbg-avs{display:inline-flex}.wbg-avs > *+*{margin-left:-6px}
.wbg-face{display:inline-flex;flex:none;border-radius:50%;box-shadow:0 0 0 2px var(--surface)}.wbg-face .grp-av{width:22px;height:22px;font-size:.6rem}.wbg-people .wbg-face{box-shadow:none}.wbg-people .wbg-face .grp-av{width:30px;height:30px;font-size:.74rem}
.wbg-av{width:22px;height:22px;border-radius:50%;flex:none;display:inline-grid;place-items:center;background:var(--c);color:#fff;font:700 .7rem var(--display);box-shadow:0 0 0 2px var(--surface)}
.wbg-acts{display:flex;gap:6px}.wbg-acts .btn{flex:1}
.wbg-from{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;background:var(--soft);border:1px solid var(--line)}.wbg-from-t{flex:1;min-width:0;display:flex;flex-direction:column}.wbg-from-t b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wbg-people{list-style:none;margin:0;padding:0;display:grid;gap:8px}.wbg-people li{display:flex;align-items:center;gap:10px;font-weight:600}.wbg-people .wbg-av{width:28px;height:28px;font-size:.8rem}
`;
  document.head.appendChild(css);
})();

