/* ===== module: 99-present-groups.js ===== */
/* Presentation practice with a study group or a group project (99-present.js does the practicing).
   - Share With a Group: the presentation goes to the group (group_items, kind "pres"), with its plan and a speaker for each
     slide, chosen from the group's members. In a Pro group the slides go too (the group's own uploads); otherwise each member
     adds their own copy of the same slides, and gets the plan and speakers from the group.
   - Everyone sees the team's progress: each member's latest practice of their own section against their target ("presrun").
   - Rehearse Together: one person leads a live rehearsal ("preslive", with a secret only the group can read) and the others
     follow on their own devices; the run goes into everyone's history.
   - Today's Plan suggests practicing before a linked task is due; a task's
     sheet offers its presentation. */
(() => {
  const PS = window.SBPRESENT; if (!PS || !PS.px) return;
  const X = PS.px;
  const G = () => (window.SBGROUPS && SBGROUPS.share) || null;
  const online = () => { try { const g = G(); return !!(g && g.online()); } catch (e) { return false; } };
  const cli = () => G().cli();
  const me = () => { try { return G().myId(); } catch (e) { return ""; } };
  const q = async p => { const r = await p; if (r && r.error) throw r.error; return r ? r.data : null; };
  const str = (v, n) => String(v == null ? "" : v).slice(0, n);
  const SP_COLORS = ["#7A4FD6", "#E07A2E", "#1E9E74", "#2F6FE4", "#D9467A", "#B8860B"];
  const okColor = c => /^#[0-9A-F]{6}$/i.test(String(c || "")) ? c : "";
  const b64u = u8 => btoa(String.fromCharCode.apply(null, Array.from(u8))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 2 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };

  /* ---------- what the groups hold: their presentations, each member's progress, live rehearsals ---------- */
  const C = {at: 0, busy: null, groups: [], items: [], sig: ""};
  const pres = () => C.items.filter(i => i.kind === "pres" && i.data && typeof i.data === "object");
  const runsOf = iid => C.items.filter(i => i.kind === "presrun" && i.ref_id === iid);
  const LIVE_MS = 3 * 3600000;
  const liveOf = iid => C.items.filter(i => i.kind === "preslive" && i.ref_id === iid && i.data && !i.data.ended && Date.now() - (Number(i.data.at) || 0) < LIVE_MS).sort((a, b) => (b.data.at || 0) - (a.data.at || 0))[0] || null;
  const gname = gid => (C.groups.find(g => g.id === gid) || {}).name || "your group";
  const localOf = iid => X.all().find(p => p.share && p.share.iid === iid);
  async function load(force){
    if (!online()) return false;
    if (C.busy) return C.busy;
    if (!force && Date.now() - C.at < 20000) return false;
    C.busy = (async () => {
      try {
        C.groups = (await q(cli().from("study_groups").select("id,name,kind"))) || [];
        if (!C.groups.length) { C.items = []; return; }
        C.items = ((await q(cli().from("group_items").select("id,group_id,user_id,author_name,kind,ref_id,title,data,updated_at,created_at").in("kind", ["pres", "presrun", "preslive"]).order("updated_at", {ascending: false}).limit(600))) || []).filter(i => C.groups.some(g => g.id === i.group_id));
        syncLinked();
      } catch (e) { C.err = /check constraint|kind_check/i.test(String(e && e.message)) ? "Group presentations need the newest supabase-groups.sql on the server." : ""; }
      finally { C.at = Date.now(); }
    })();
    try { await C.busy; } finally { C.busy = null; }
    const sig = C.items.map(i => i.id + i.updated_at).join("|");
    const changed = sig !== C.sig; C.sig = sig;
    if (changed) { X.rerenderList(); X.refreshReady(); }
    return changed;
  }
  // a linked copy follows the group's plan, speakers and name (unless it's your own)
  function syncLinked(){
    let any = false;
    X.all().forEach(p => {
      const s = p.share; if (!s || s.own) return;
      const it = pres().find(i => i.id === s.iid); if (!it) return;
      const ver = String(it.updated_at || ""); if (ver && ver === s.ver) return;
      applyItem(p, it); s.ver = ver; any = true;
    });
    if (any) X.save();
  }
  function applyItem(p, it){
    const d = it.data, n = p.slides;
    p.name = str(d.name || it.title, 120) || p.name;
    if (d.plan && typeof d.plan === "object") {
      const T = Number(d.plan.target); if (T >= 30 && T <= 7200) p.target = Math.round(T);
      p.split = d.plan.split === "notes" ? "notes" : d.plan.split === "custom" ? "custom" : "even";
      p.custom = Array.isArray(d.plan.custom) && d.plan.custom.length === n ? d.plan.custom.map(x => Math.max(5, Math.min(1800, Math.round(Number(x) || 60)))) : null;
      if (p.split === "custom" && !p.custom) p.split = "even";
    }
    const sp = (Array.isArray(d.sp) ? d.sp : []).slice(0, 6).map((x, k) => ({id: str(x.id, 60), name: str(x.name, 40) || "Speaker " + (k + 1), c: okColor(x.c) || SP_COLORS[k % 6]})).filter(x => x.id);
    if (sp.length) {
      const by = (Array.isArray(d.by) ? d.by : []).slice(0, n).map(x => str(x, 60)).map(id => sp.some(s => s.id === id) ? id : sp[0].id);
      p.group = {on: true, sp, by: by.length === n ? by : null};
      if (!p.group.by) X.splitEvenly(p);
    }
    if (d.due && /^\d{4}-\d{2}-\d{2}$/.test(d.due)) p.due = d.due;
    if (Array.isArray(d.steps) && d.steps.length === n) p.steps = d.steps.map(x => Math.max(0, Math.min(60, Math.round(Number(x) || 0))));
    if (d.vids && typeof d.vids === "object") p.vids = cleanVids(d.vids);
    if (!p.taskId && d.taskTitle) { const t = tasksArr().find(x => x.status !== "done" && String(x.title).trim().toLowerCase() === String(d.taskTitle).trim().toLowerCase()); if (t) p.taskId = t.id; }
  }
  const itemData = p => {
    const c = courseOf(p.courseId), t = p.taskId && state.tasks[p.taskId], g = X.grp(p);
    return {v: 1, name: p.name, title: p.title || "", slides: p.slides, kind: p.kind, path: (p.share && p.share.path) || "", notes: p.kind === "pdf" && Array.isArray(p.notesArr) ? p.notesArr.map(x => str(x, 3000)) : null,
      plan: {target: p.target, split: p.split || "even", custom: Array.isArray(p.custom) ? p.custom : null}, sp: g ? g.sp : [], by: g ? (g.by || []) : [],
      due: (t && t.due) || p.due || "", taskTitle: t ? str(t.title, 200) : "", course: c ? {code: str(c.code, 40), name: str(c.name, 120)} : null, secret: (p.share && p.share.secret) || "",
      steps: Array.isArray(p.steps) ? p.steps.slice(0, 500) : null, pages: Array.isArray(p.pages) ? p.pages.slice(0, 500) : null, vids: cleanVids(p.vids)};
  };

  /* ---------- Share With a Group ---------- */
  let SH = null;
  async function shareSheet(pid){
    const p = X.byId(pid); if (!p) return;
    if (!online()) { toast("Sign in to share with a study group or group project.", null, window.SBGUEST && SBGUEST.signUp ? {label: "Sign In", fn: () => SBGUEST.signUp()} : undefined); return; }
    SH = {pid, gid: "", members: [], picked: new Set(), busy: "", err: "", file: true, size: 0, vsize: 0};
    try { const b = await X.get("deck:" + p.id); SH.size = b ? b.byteLength : 0; if (b && p.kind === "pptx") SH.vsize = await mediaBytes(b); } catch (e) {}
    openSheet(`<div class="sheet">${head("Share With a Group")}<div class="sheet-body"><p class="mini" role="status">Loading your groups…</p></div></div>`);
    try { C.groups = (await q(cli().from("study_groups").select("id,name,kind"))) || []; } catch (e) { SH.err = "Couldn't load your groups. Check your connection."; }
    if (!SH || SH.pid !== pid) return;
    SH.gid = (C.groups.find(g => g.kind === "project") || C.groups[0] || {}).id || "";
    await pickGroup(SH.gid);
  }
  async function pickGroup(gid){
    const S = SH; if (!S) return; S.gid = gid; S.members = [];
    if (gid) { try { await G().loadMembers(gid); } catch (e) {} S.members = (G().members(gid) || []).slice(0, 30); S.picked = new Set(S.members.slice(0, 6).map(m => m.id)); }
    drawShare();
  }
  function drawShare(){
    const S = SH; if (!S) return; const p = X.byId(S.pid); if (!p) return;
    if (!C.groups.length) {
      openSheet(`<div class="sheet">${head("Share With a Group")}<div class="sheet-body"><p style="margin:0">${S.err ? esc(S.err) : "Join or start a study group or a group project first. Then everyone in it can practice their part, see the team's progress and rehearse together."}</p></div>
        <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Not Now</button><button type="button" class="btn primary" data-act="prg-groups">Groups</button></div></div>`);
      return;
    }
    const av = m => { let h = ""; try { h = G().avatar(S.gid, m.id, m.name); } catch (e) {} return h ? `<span class="prg-face">${h}</span>` : `<span class="prg-av" style="--c:${esc(okColor(m.color) || "#7A8494")}">${esc((m.name || "?").charAt(0).toUpperCase())}</span>`; };
    openSheet(`<form class="sheet prg-sheet">${head("Share With a Group")}<div class="sheet-body">
      <p style="margin:0">Everyone in the group gets “${esc(p.name)}” with its plan, and each speaker gets their own slides and target. You'll all see each other's progress and can rehearse together.</p>
      <label class="f">Group<select id="prgGroup">${C.groups.map(g => `<option value="${esc(g.id)}" ${g.id === S.gid ? "selected" : ""}>${esc(g.name)}${g.kind === "project" ? " (group project)" : ""}</option>`).join("")}</select></label>
      <fieldset class="prg-spk"><legend>Speakers <span class="hint">up to 6, in the order they present</span></legend>
        ${S.members.length ? S.members.map(m => `<label class="mi-check prg-m">${av(m)}<input type="checkbox" value="${esc(m.id)}" ${S.picked.has(m.id) ? "checked" : ""}> ${esc(m.id === me() ? (m.name || "You") + " (you)" : m.name || "A member")}</label>`).join("") : `<p class="mini">Loading members…</p>`}
      </fieldset>
      <p class="mini" style="margin:0">The slides are split evenly between the speakers to start with. Change who presents which slide in the Plan. ${p.taskId && state.tasks[p.taskId] ? `It's for “${esc(state.tasks[p.taskId].title)}”, due ${esc(fmtShort(state.tasks[p.taskId].due))}.` : ""}</p>
      ${S.size ? `<label class="mi-check prg-file"><input type="checkbox" id="prgFile" ${S.file ? "checked" : ""}> <span>Share the slides too <b>(${esc(mb(S.size - S.vsize))})</b>: they count in your own file storage.${S.vsize ? ` Their videos stay on your device (they'd take ${esc(mb(S.vsize))}): everyone else gets each video's length, and can skip it.` : ""}</span></label>` : ""}
      <p class="mini" style="margin:0">${S.file && S.size ? "Members open the slides straight away." : "Each member adds their own copy of the same slides."} Recordings are never shared.</p>
      ${S.err ? `<p class="pr-err">${esc(S.err)}</p>` : ""}${S.busy ? `<p class="pr-busy"><span class="ai-spin" aria-hidden="true"></span>${esc(S.busy)}</p>` : ""}</div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-act="prg-share-go" ${S.busy ? "disabled" : ""}>Share</button></div></form>`);
    const sel = dlg.querySelector("#prgGroup"); if (sel) sel.addEventListener("change", () => pickGroup(sel.value));
    const fl = dlg.querySelector("#prgFile"); if (fl) fl.addEventListener("change", () => { S.file = fl.checked; drawShare(); });
    dlg.querySelectorAll(".prg-spk input").forEach(cb => cb.addEventListener("change", () => { if (cb.checked) { if (S.picked.size >= 6) { cb.checked = false; toast("Up to 6 speakers."); return; } S.picked.add(cb.value); } else S.picked.delete(cb.value); }));
  }
  async function shareGo(){
    const S = SH; if (!S || S.busy) return; const p = X.byId(S.pid); if (!p || !S.gid) return;
    const chosen = S.members.filter(m => S.picked.has(m.id));
    if (!chosen.length) { S.err = "Pick at least one speaker."; drawShare(); return; }
    S.busy = "Sharing…"; S.err = ""; drawShare();
    const ext = p.kind === "pdf" ? "pdf" : "pptx", type = p.kind === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    let path = "", note = "";
    if (S.file) try {
      let bytes = await X.get("deck:" + p.id);
      if (bytes && p.kind === "pptx" && S.vsize) { S.busy = "Leaving out the videos…"; drawShare(); const sl = await slimPptx(bytes); if (sl && sl.byteLength < bytes.byteLength) bytes = sl; }
      if (bytes && bytes.byteLength > 50 * 1048576) throw new Error("SB_TOO_BIG");
      if (bytes && cli().storage) {
        S.busy = `Uploading the slides (${mb(bytes.byteLength)})…`; drawShare();
        const pth = `${me()}/g/${S.gid}/pres-${p.id}.${ext}`;
        const {error} = await cli().storage.from(SB_BUCKET).upload(pth, new Blob([bytes], {type}), {contentType: type, upsert: true});
        if (error) throw error; path = pth;
      }
    } catch (e) { const m = String((e && e.message) || e); note = /SB_STORAGE_LIMIT/.test(m) ? "Your file storage is full, so the slides weren't shared: each member adds their own copy." : /SB_TOO_BIG/.test(m) ? "The slides are over 50 MB, so each member adds their own copy." : /SB_GROUP_PRO/.test(m) ? "Sharing slides with this group needs the newest supabase-plans.sql on the server, so each member adds their own copy." : /SB_GROUP_STORAGE/.test(m) ? "The group's uploads are full (2 GB), so each member adds their own copy of the slides." : "The slides couldn't be uploaded, so each member adds their own copy."; }
    const sp = chosen.slice(0, 6).map((m, k) => ({id: m.id, name: str(m.name || (m.id === me() ? "You" : "Member"), 40), c: okColor(m.color) || SP_COLORS[k % 6]}));
    p.group = {on: true, sp, by: null}; X.splitEvenly(p);
    const secret = b64u(crypto.getRandomValues(new Uint8Array(18)));
    p.share = {gid: S.gid, gname: gname(S.gid), iid: "", own: true, path, secret, ver: ""};
    try {
      const row = await q(cli().from("group_items").insert({group_id: S.gid, kind: "pres", ref_id: p.id, title: str(p.name, 300) || "Presentation", data: itemData(p)}).select().single());
      p.share.iid = row.id; p.share.ver = String(row.updated_at || ""); C.items.unshift(row);
    } catch (e) {
      p.share = null; S.busy = "";
      S.err = /check constraint|kind_check/i.test(String(e && e.message)) ? "Group presentations need the newest supabase-groups.sql on the server." : String((e && e.message) || "Couldn't share it. Try again.").replace(/^SB_[A-Z_]+:\s*/, "").slice(0, 200);
      drawShare(); return;
    }
    X.save(); SH = null; if (dlg.open) dlg.close();
    toast(`Shared with ${gname(S.gid)}.${note ? " " + note : ""}`);
    X.refreshReady(); X.rerenderList();
  }
  // videos, as the group gets them: lengths and where they are (never anyone's file)
  function cleanVids(v){
    const out = {}; let n = 0;
    Object.keys(v || {}).forEach(k => { if (!/^\d{1,3}$/.test(k)) return; const list = (Array.isArray(v[k]) ? v[k] : []).slice(0, 6).map(x => ({id: str(x.id, 40) || uid(), kind: /^(file|link|manual)$/.test(x.kind) ? x.kind : "manual", dur: Math.max(0, Math.min(7200, Math.round(Number(x.dur) || 0))), spid: /^\d{1,9}$/.test(String(x.spid || "")) ? String(x.spid) : "", path: /^ppt\/media\/[\w.\-]{1,120}$/.test(String(x.path || "")) ? x.path : "", url: /^https:\/\//i.test(String(x.url || "")) ? str(x.url, 500) : "", name: str(x.name, 80), audio: !!x.audio, play: !!x.play, pg: Number.isInteger(x.pg) ? x.pg : undefined})); if (list.length && n++ < 200) out[k] = list; });
    return out;
  }
  // the owner's plan changes reach the group (a moment after the last one)
  let upT = 0;
  hook("pr-plan-changed", p => {
    if (!p || !p.share || !p.share.own || !p.share.iid || !online()) return;
    clearTimeout(upT); upT = setTimeout(async () => {
      try { const row = await q(cli().from("group_items").update({title: str(p.name, 300) || "Presentation", data: itemData(p)}).eq("id", p.share.iid).select().single()); if (row) { p.share.ver = String(row.updated_at || ""); const k = C.items.findIndex(i => i.id === row.id); if (k >= 0) C.items[k] = row; X.save(); } } catch (e) {}
    }, 1500);
  });
  hook("pr-open", p => { if (p && p.share && online()) return load(true).catch(() => {}); });

  // a PowerPoint's video and sound files (they can be big); the slides shared without them
  const MEDIA_RX = /^ppt\/media\/[^/]+\.(mp4|m4v|mov|webm|ogv|mpg|mpeg|wmv|avi|mkv|mp3|m4a|wav|wma|aac|ogg)$/i;
  const mb = n => n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
  async function mediaBytes(u8){
    const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength); let eocd = -1;
    for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) return 0;
    let p = dv.getUint32(eocd + 16, true), sum = 0; const n = dv.getUint16(eocd + 10, true), dec = new TextDecoder();
    for (let k = 0; k < n && p + 46 <= u8.length; k++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const cs = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
      if (MEDIA_RX.test(dec.decode(u8.subarray(p + 46, p + 46 + nl)))) sum += cs;
      p += 46 + nl + xl + cl;
    }
    return sum;
  }
  async function slimPptx(u8){
    try {
      let cut = 0; const all = await unzipBytes(new Blob([u8]), n => { if (MEDIA_RX.test(n)) { cut++; return false; } return true; }, {max: 100 * 1048576});
      if (!cut) return null;
      return new Uint8Array(await (await TB.zipBlob(Object.keys(all).map(name => ({name, data: all[name]})))).arrayBuffer());
    } catch (e) { return null; }
  }

  /* ---------- adding a group's presentation ---------- */
  async function addFromGroup(iid, then){
    const it = pres().find(i => i.id === iid); if (!it) { toast("That presentation isn't in your groups any more."); return null; }
    const have = localOf(iid); if (have) { if (then) then(have); return have; }
    const d = it.data, matchC = G() && G().matchCourse ? G().matchCourse(d.course) : "";
    const link = {iid, gid: it.group_id, gname: gname(it.group_id), title: str(d.name || it.title, 120), plan: d.plan, kind: d.kind, path: d.path, then};
    if (d.path) {
      toast("Getting the slides…");
      try {
        const blob = await sbDownload(d.path, cli()), bytes = new Uint8Array(await blob.arrayBuffer());
        const p = await X.createFrom(bytes, d.kind === "pdf" ? "pdf" : "pptx", {name: link.title, courseId: matchC || "", pages: Array.isArray(d.pages) ? d.pages : null}, Array.isArray(d.notes) ? d.notes : null);
        linkTo(p, it); X.save(); X.rerenderList(); toast(`Added ${p.name}`);
        if (then) then(p);
        return p;
      } catch (e) { toast("Couldn't get the group's slides. Add your own copy instead."); }
    }
    X.newSheet(matchC || "", {link});
    return null;
  }
  function linkTo(p, it){
    p.share = {gid: it.group_id, gname: gname(it.group_id), iid: it.id, own: it.user_id === me(), path: (it.data && it.data.path) || "", secret: str(it.data && it.data.secret, 60), ver: ""};
    if (p.slides !== Number(it.data.slides) && Number(it.data.slides)) toast(`Your copy has ${p.slides} slides and the group's has ${it.data.slides}, so some slide times may not line up.`);
    applyItem(p, it); p.share.ver = String(it.updated_at || "");
  }
  hook("pr-linked", (p, link) => { const it = pres().find(i => i.id === link.iid); if (!it) return; linkTo(p, it); X.save(); if (link.then) setTimeout(() => link.then(p), 0); });

  /* ---------- each member's progress ---------- */
  function mine(p, run){
    const g = X.grp(p), my = g && g.sp.find(s => s.id === me());
    const idx = run.times.map((_, i) => i).filter(i => (!run.sec || (i >= run.sec[0] && i <= run.sec[1])) && (!my || ((g.by || [])[i] || g.sp[0].id) === my.id));
    return {t: idx.reduce((a, i) => a + run.times[i], 0), b: idx.reduce((a, i) => a + run.budgets[i], 0), n: idx.length};
  }
  hook("pr-finish", async (p, run) => {
    if (!p || !p.share || !p.share.iid || !online()) return;
    const m = mine(p, run), data = {v: 1, t: Math.round(m.t), b: Math.round(m.b), n: m.n, total: run.total, target: run.target, full: !run.sec, live: !!run.live, at: run.at};
    try {
      const old = runsOf(p.share.iid).find(i => i.user_id === me());
      const row = old ? await q(cli().from("group_items").update({data, title: str(p.name, 300) || "Presentation"}).eq("id", old.id).select().single())
        : await q(cli().from("group_items").insert({group_id: p.share.gid, kind: "presrun", ref_id: p.share.iid, title: str(p.name, 300) || "Presentation", data}).select().single());
      if (row) { C.items = [row].concat(C.items.filter(i => i.id !== row.id)); }
    } catch (e) {}
  });
  function teamRows(p, gid){
    const iid = p.share ? p.share.iid : "", g = X.grp(p); if (!g) return [];
    const runs = runsOf(iid), live = liveOf(iid);
    return g.sp.map(s => {
      const r = runs.find(x => x.user_id === s.id), d = r && r.data, ok = d && d.b ? d.t <= d.b * 1.1 + 3000 : false;
      return {s, d, ok, txt: d ? `${X.fmt(d.t)} of ${X.fmt(d.b)} · ${ago(Number(d.at) || Date.parse(r.updated_at))}${d.live ? " · together" : ""}` : "Not practiced yet", live};
    });
  }
  function teamHtml(p, compact){
    const rows = teamRows(p); if (!rows.length) return "";
    const gid = p.share && p.share.gid, ready = rows.filter(r => r.ok).length;
    const av = s => { let h = ""; try { h = gid ? G().avatar(gid, s.id, s.name) : ""; } catch (e) {} return h ? `<span class="prg-face">${h}</span>` : `<span class="prg-av" style="--c:${esc(s.c)}">${esc((s.name || "?").charAt(0).toUpperCase())}</span>`; };
    return `<div class="prg-team${compact ? " sm" : ""}"><div class="prg-team-h"><b>The team</b><span class="mini">${ready} of ${rows.length} on target</span></div>
      <ul>${rows.map(r => `<li style="--sp:${esc(r.s.c)}">${av(r.s)}<span class="prg-tn">${esc(r.s.id === me() ? r.s.name + " (you)" : r.s.name)}</span><span class="prg-tt ${r.d ? (r.ok ? "ok" : "warn") : "none"}">${r.d ? (r.ok ? "✓ " : "") : ""}${esc(r.txt)}</span></li>`).join("")}</ul></div>`;
  }

  /* ---------- in presentation practice: the Ready card, the review, the cards and the list ---------- */
  hook("pr-ready-extra", (p, S) => {
    if (!p) return "";
    if (!p.share) return online() ? `<button type="button" class="btn small pr-plan-btn" data-act="prg-share" data-id="${esc(p.id)}">${X.IC.users} Share With a Group or Project</button>` : "";
    load().catch(() => {});
    const live = liveOf(p.share.iid), mineLive = live && live.user_id === me();
    const owner = p.share.own ? "" : `<p class="mini pr-card-note">Shared in ${esc(p.share.gname || gname(p.share.gid))}. The plan and speakers come from the group.</p>`;
    const btn = S && S.lv ? `<p class="mini pr-card-note">${X.IC.users} Rehearsing together: everyone in the group can join now.</p>`
      : live && !mineLive ? `<button type="button" class="btn small pr-plan-btn prg-joinbtn pr-hero" data-act="prg-join" data-id="${esc(live.id)}">Join ${esc(live.author_name || "the group")}'s Live Rehearsal</button>`
      : `<button type="button" class="btn small pr-plan-btn pr-hero" data-act="prg-live" data-id="${esc(p.id)}">${X.IC.users} Rehearse Together</button>`;
    return owner + teamHtml(p, true) + btn;
  });
  hook("pr-review-extra", p => p && p.share ? teamHtml(p) : "");
  hook("pr-card-badge", p => {
    if (!p || !p.share) return "";
    const live = liveOf(p.share.iid);
    const t = (live ? "Live rehearsal now in " : "Shared with ") + (p.share.gname || gname(p.share.gid));
    return `<span class="prg-badge prg-cbadge${live ? " live" : ""}" title="${esc(t)}">${X.IC.users}<span class="sr">${esc(t)}</span></span>`;
  });
  hook("pr-list-extra", () => {
    if (!online()) return "";
    load().catch(() => {});
    const lives = pres().map(it => ({it, live: liveOf(it.id)})).filter(x => x.live && x.live.user_id !== me());
    const fresh = pres().filter(it => !localOf(it.id) && it.user_id !== me());
    if (!lives.length && !fresh.length) return C.err ? `<p class="mini pr-err">${esc(C.err)}</p>` : "";
    return `${lives.map(x => `<div class="prg-livebar" role="status"><span class="prg-dot" aria-hidden="true"></span><span><b>${esc(x.live.author_name || "Someone")}</b> is leading a live rehearsal of <b>${esc(x.it.title)}</b> in ${esc(gname(x.it.group_id))}</span><button type="button" class="btn small primary" data-act="prg-join" data-id="${esc(x.live.id)}">Join</button></div>`).join("")}
      ${fresh.length ? `<section class="prg-new"><h3 class="fsec">From Your Groups</h3><div class="prg-new-list">${fresh.map(it => `<div class="prg-new-i"><span class="prg-new-t"><b>${esc(it.title)}</b><span class="mini">${esc(gname(it.group_id))} · shared by ${esc(it.author_name || "a member")} · ${Number(it.data.slides) || "?"} slides${(it.data.sp || []).length ? ` · ${(it.data.sp || []).length} speakers` : ""}${it.data.due ? ` · due ${esc(fmtShort(it.data.due))}` : ""}</span></span><button type="button" class="btn small primary" data-act="prg-add" data-id="${esc(it.id)}">${it.data.path ? "Add" : "Add My Copy"}</button></div>`).join("")}</div></section>` : ""}`;
  });

  /* ---------- live rehearsals ---------- */
  async function liveStart(pid){
    const p = X.byId(pid); if (!p || !p.share) return;
    const S = X.stage(); if (!S || S.p.id !== pid || S.started) return;
    let secret = p.share.secret;
    if (!secret) { const it = pres().find(i => i.id === p.share.iid); secret = it && it.data && it.data.secret; }
    if (!secret) { toast("This shared presentation is from an older version. Share it again to rehearse together."); return; }
    let row = null;
    try { row = await q(cli().from("group_items").insert({group_id: p.share.gid, kind: "preslive", ref_id: p.share.iid, title: str(p.name, 300) || "Presentation", data: {v: 1, at: Date.now(), ended: false}}).select().single()); C.items.unshift(row); }
    catch (e) { toast(/check constraint|kind_check/i.test(String(e && e.message)) ? "Rehearsing together needs the newest supabase-groups.sql on the server." : "Couldn't start the rehearsal. Check your connection."); return; }
    await X.liveHost(secret, {liveId: row.id});
    toast(`Everyone in ${p.share.gname || "the group"} can join now. Press play when you're all ready.`);
  }
  hook("pr-live-end", async (p, meta) => {
    if (!meta || !meta.liveId || !online()) return;
    try { await q(cli().from("group_items").update({data: {v: 1, at: Date.now(), ended: true}}).eq("id", meta.liveId)); const it = C.items.find(i => i.id === meta.liveId); if (it) it.data = {v: 1, ended: true}; } catch (e) {}
  });
  async function join(liveId){
    await load(true).catch(() => {});
    const lv = C.items.find(i => i.id === liveId && i.kind === "preslive");
    if (!lv || !lv.data || lv.data.ended) { toast("That rehearsal has ended."); return; }
    const it = pres().find(i => i.id === lv.ref_id); if (!it) return;
    const go = p => { const secret = (p.share && p.share.secret) || (it.data && it.data.secret); if (!secret) { toast("This presentation needs to be shared again to rehearse together."); return; } X.follow(p.id, secret, lv.author_name || ""); };
    const have = localOf(it.id);
    if (have) { go(have); return; }
    const p = await addFromGroup(it.id, go);
    if (!p && !it.data.path) toast("Add your copy of the slides, then you'll join the rehearsal.");
  }

  /* ---------- Today's Plan and tasks ---------- */
  const dueOf = p => { const t = p.taskId && state.tasks[p.taskId]; return t && t.status !== "done" ? t.due : p.due || ""; };
  hook("pr-today", () => {
    const today = todayISO(), soon = addDays(today, 7);
    const rows = X.all().map(p => ({p, due: dueOf(p)})).filter(x => x.due && x.due >= today && x.due <= soon).filter(x => { const last = (x.p.runs || [])[0]; return !last || Date.now() - last.at > 36 * 3600000 || x.due <= addDays(today, 1); }).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 3);
    return rows.map(({p, due}) => { const runs = (p.runs || []).filter(r => !r.sec), best = runs.length ? Math.min(...runs.map(r => r.total)) : null;
      return `<div class="pp-today-row prg-today"><span class="pp-today-t">${X.IC.present}<span>Practice <b>${esc(p.name)}</b>, due ${esc(due === today ? "today" : due === addDays(today, 1) ? "tomorrow" : fmtShort(due))}${best != null ? ` · best ${X.fmt(best)} of ${X.fmt(p.target * 1000)}` : " · not practiced yet"}</span></span><span class="pp-today-a"><button type="button" class="btn small primary" data-act="pr-practice" data-id="${esc(p.id)}">Practice</button></span></div>`; }).join("");
  });
  const PRES_RX = /present|talk|speech|pitch|slides|defen[cs]e|seminar|poster/i;
  hook("pr-task", t => {
    if (!t || !t.id) return "";
    const p = X.all().find(x => x.taskId === t.id);
    if (p) { const runs = (p.runs || []).filter(r => !r.sec), best = runs.length ? Math.min(...runs.map(r => r.total)) : null;
      return `<div class="pp-form prg-task"><div><b>Presentation practice</b><span class="mini"> ${esc(p.name)} · ${best != null ? `best ${X.fmt(best)} of ${X.fmt(p.target * 1000)}` : "not practiced yet"}${p.share ? ` · shared with ${esc(p.share.gname || "your group")}` : ""}</span></div><button type="button" class="btn small primary" data-act="pr-practice" data-id="${esc(p.id)}">Practice</button></div>`; }
    if (t.status === "done" || !PRES_RX.test(t.title || "")) return "";
    return `<div class="pp-form prg-task"><div><b>Presentation practice</b><span class="mini"> Add your slides to time yourself, slide by slide, before it's due.</span></div><button type="button" class="btn small" data-act="prg-task-new" data-id="${esc(t.id)}">Practice It</button></div>`;
  });

  /* ---------- actions; refreshing while it matters ---------- */
  hook("act", (act, el, id) => {
    switch (act) {
      case "prg-share": shareSheet(id); return true;
      case "prg-share-go": shareGo(); return true;
      case "prg-groups": if (dlg.open) dlg.close(); ui.tab = "groups"; render(); window.scrollTo(0, 0); return true;
      case "prg-add": addFromGroup(id); return true;
      case "prg-live": liveStart(id); return true;
      case "prg-join": join(id); return true;
      case "prg-task-new": if (dlg.open) dlg.close(); X.newSheet("", {taskId: id}); return true;
    }
    return false;
  });
  if (window.__SB_TEST) PS._groups = {load, items: () => C.items, slimPptx, mediaBytes};
  setInterval(() => {
    if (document.hidden || !online()) return;
    const onList = ui.tab === "flashcards" && ui.rvView === "present", ready = X.stage() && !X.stage().started && X.stage().p.share;
    if (onList || ready) load(true).catch(() => {});
  }, 20000);
})();
