/* ===== module: 82-friend-share.js ===== */
/* Send a deck, quiz or concept map straight to friends, no code needed (supabase-friend-shares.sql). The friend sees it the
   next time they open Studyboard, or at once if they're online, and chooses Add or No Thanks. */
(() => {
  /*FS-START*/
  const FS = (() => {
    const WHAT = {deck: "deck", quiz: "quiz", map: "concept map"};
    const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
    // "Ann sent you a deck", "Ann and 2 others sent you things"
    const line = r => `${r.from_name || "A friend"} sent you ${r.kind === "quiz" ? "a quiz" : r.kind === "map" ? "a concept map" : "a deck"}`;
    // Which waiting ones to show now: not already shown (or put off) this session, newest first, at most 5
    const fresh = (rows, seen) => (Array.isArray(rows) ? rows : []).filter(r => r && r.id && !seen.has(r.id)).slice(0, 5);
    return {WHAT, plural, line, fresh};
  })();
  /*FS-END*/

  /* Connection (the Study Groups test stand-in works here too) */
  const stub = () => window.__sbGroupsStub || null;
  const cli = () => { const s = stub(); return s ? s.client : (typeof sbActive === "function" && sbActive() ? sb : null); };
  const me = () => { const s = stub(); return s ? s.user : (typeof sbUser !== "undefined" ? sbUser : null); };
  const live = () => !(typeof inPreview === "function" && inPreview()) && !!cli() && !!me() && !me().is_anonymous;
  const G = () => (window.SBGROUPS && SBGROUPS.share) || null;
  const missing = e => { const m = String((e && (e.message || e.details)) || ""), c = String((e && e.code) || ""); return ["42883", "PGRST202", "42P01", "PGRST205"].includes(c) || /Could not find the function|schema cache|does not exist/i.test(m); };
  const words = e => String((e && (e.message || e.details)) || e || "").replace(/^SB_[A-Z0-9_]+:\s*/, "").slice(0, 200) || "Something went wrong. Try again.";
  async function rpc(fn, args){
    const c = cli(); if (!c) throw new Error("Sign in to Studyboard first, then try again.");
    let r; try { r = await c.rpc(fn, args || {}); } catch (e) { throw new Error(/fetch|network|Load failed/i.test(String(e && e.message)) ? "Couldn't reach Studyboard. Check your connection and try again." : words(e)); }
    if (r && r.error) { const err = new Error(missing(r.error) ? srvSetup("Sending to friends", "friend-shares.sql") : words(r.error)); err.setup = missing(r.error); throw err; }
    return r ? r.data : null;
  }
  const S = {uid: "", seen: new Set(), chan: null, busy: false, setup: false, at: 0};

  /* What goes */
  function payloadOf(kind, ref){
    const g = G(); if (!g) return null;
    if (kind === "deck") {
      const d = state.decks[ref]; if (!d) return null;
      const data = g.deckPayload(d, true, false); if (!data.cards.length && !data.quizzes.length) return null;
      return {title: d.name || "Deck", info: FS.plural(data.cards.length, "card"), data};
    }
    if (kind === "quiz") {
      const [did, qid] = String(ref).split(":"), d = state.decks[did], qz = d && (d.aiQuizzes || []).find(x => x.id === qid); if (!qz) return null;
      const data = g.quizPayload(qz, d.courseId);
      return {title: qz.title || "Practice Quiz", info: FS.plural((qz.questions || []).length, "question"), data};
    }
    if (kind === "map") {
      const [cid, mid] = String(ref).split(":"); if (!window.SBCMAPG || !SBCMAPG.friendPayload) return null;
      return SBCMAPG.friendPayload(cid, mid || "main");
    }
    return null;
  }

  /* Sending */
  async function send(kind, ref){
    if (!live()) { toast("Sign in to send things to friends.", null, window.SBGUEST && SBGUEST.signUp ? {label: "Sign In", fn: () => SBGUEST.signUp()} : undefined); return; }
    const p = payloadOf(kind, ref); if (!p) { toast(kind === "map" ? "Add something to the map first, then send it." : `That ${FS.WHAT[kind]} is empty. Add to it first.`); return; }
    openSheet(`<div class="sheet fs-sheet">${head("Send to Friends")}<div class="sheet-body"><p class="mini" style="margin:0" role="status">Loading your friends…</p></div></div>`);
    let rows = null;
    try { rows = window.SBFRIENDS && SBFRIENDS.load ? await SBFRIENDS.load(true) : null; } catch (e) { rows = null; }
    if (!dlg.open || !dlg.querySelector(".fs-sheet")) return;
    const friends = (Array.isArray(rows) ? rows : []).filter(r => r && r.status === "accepted");
    if (!friends.length) {
      openSheet(`<div class="sheet fs-sheet">${head("Send to Friends")}<div class="sheet-body"><p style="margin:0">Add a friend first. Then you can send them decks, quizzes and concept maps without a code.</p></div>
        <div class="sheet-foot"><button type="button" class="btn" data-act="close">Not Now</button><span class="spacer"></span><button type="button" class="btn primary" id="fsAdd">Add a Friend</button></div></div>`);
      const b = $("#fsAdd"); if (b) b.addEventListener("click", () => { dlg.close(); if (window.SBFRIENDS && SBFRIENDS.open) SBFRIENDS.open(); });
      return;
    }
    const g = G(), av = r => { try { return g && g.avatar ? g.avatar("", r.user_id, r.display_name, r.face || "") : ""; } catch (e) { return ""; } };
    openSheet(`<form class="sheet fs-sheet">${head("Send to Friends")}<div class="sheet-body">
      <p style="margin:0">Send <b>${esc(p.title)}</b> (${esc(p.info)}). They'll see it the next time they open Studyboard, or right away if they're on now. Nothing changes on your copy.</p>
      ${p.priv ? `<p class="mini" style="margin:0">Boxes for your own notes, files and decks go as plain ideas with just their names.</p>` : ""}
      <ul class="fs-list">${friends.map(r => `<li><label class="fs-pick">${av(r)}<span class="fs-who"><b>${esc(r.display_name || "Friend")}</b>${r.username ? `<span class="mini">@${esc(r.username)}</span>` : ""}</span><input type="checkbox" name="to" value="${esc(r.user_id)}"${friends.length === 1 ? " checked" : ""}></label></li>`).join("")}</ul>
      ${g && g.rightsBox ? g.rightsBox() : ""}
      <p class="mini" id="fsMsg" role="status" style="margin:0"></p></div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span><button type="submit" class="btn primary" data-submit id="fsGo">Send</button></div></form>`, fd => {
      const to = fd.getAll("to").map(String).filter(Boolean);
      if (!to.length) { $("#fsMsg").textContent = "Pick at least one friend."; return false; }
      if (g && g.rightsOk && !g.rightsOk()) return false;
      const btn = $("#fsGo"); if (btn) btn.disabled = true;
      rpc("send_to_friends", {p_kind: kind, p_title: p.title, p_info: p.info, p_data: p.data, p_to: to}).then(n => {
        if (dlg.open) dlg.close();
        const names = friends.filter(r => to.includes(r.user_id)).map(r => r.display_name || "your friend");
        toast(n ? `Sent to ${names.length === 1 ? names[0] : names.length + " friends"}. They'll see it when they open Studyboard.` : "Couldn't send it. They may not be your friend any more.", null, null, n ? {done: true} : {error: true});
      }).catch(e => { if (btn) btn.disabled = false; const m = $("#fsMsg"); if (m) m.textContent = e.message; });
      return false;
    });
  }

  /* Receiving */
  async function check(){
    if (!live() || S.busy || S.setup) return;
    const id = me().id; if (S.uid !== id) { S.uid = id; S.seen = new Set(); listen(); }
    S.busy = true;
    try {
      const rows = await rpc("my_friend_shares");
      const todo = FS.fresh(rows, S.seen);
      if (todo.length) offer(todo);
    } catch (e) { if (e.setup) S.setup = true; }
    finally { S.busy = false; S.at = Date.now(); }
  }
  // One at a time; if something else is open, a note with View instead of taking over the screen
  function offer(list){
    const r = list[0]; if (!r) return;
    S.seen.add(r.id);
    if (dlg.open) { toast(`${FS.line(r)}: ${r.title}`, null, {label: "View", fn: () => sheet(r, list.slice(1))}); return; }
    sheet(r, list.slice(1));
  }
  function sheet(r, rest){
    const g = G(), pic = (() => { try { return g && g.avatar ? g.avatar("", r.from_user, r.from_name, r.from_face || "") : ""; } catch (e) { return ""; } })();
    const where = r.kind === "map" ? "your concept maps" : r.kind === "quiz" ? "your quizzes" : "your flashcards";
    openSheet(`<div class="sheet fs-sheet fs-in">${head(FS.line(r))}<div class="sheet-body">
      <div class="fs-card">${pic}<div class="fs-who"><b>${esc(r.title)}</b><span class="mini">${esc(r.info || FS.WHAT[r.kind])}${r.from_username ? ` · from @${esc(r.from_username)}` : ""}</span></div></div>
      <p class="mini" style="margin:0">Add puts your own copy in ${where}. If you don't answer now, it waits for 30 days.</p></div>
      <div class="sheet-foot"><button type="button" class="btn" id="fsNo">No Thanks</button><span class="spacer"></span><button type="button" class="btn" data-act="close">Later</button><button type="button" class="btn primary" id="fsYes">Add</button></div></div>`);
    const done = () => { if (rest && rest.length) setTimeout(() => offer(rest), 350); };
    const go = add => async e => {
      e.currentTarget.disabled = true;
      try {
        const res = await rpc("take_friend_share", {p_id: r.id, p_add: add});
        if (dlg.open) dlg.close();
        if (add) take(r, res); else toast("Okay, not added.");
      } catch (err) { if (dlg.open) dlg.close(); toast(err.message, null, null, {error: true}); }
      done();
    };
    $("#fsYes").addEventListener("click", go(true)); $("#fsNo").addEventListener("click", go(false));
    dlg.addEventListener("close", function once(){ dlg.removeEventListener("close", once); }, {once: true});
  }
  // Their copy, made yours
  function take(r, res){
    const g = G(), data = res && res.data, by = String((res && res.from) || r.from_name || "A friend").slice(0, 60), meta = {by, v: r.created_at, friend: 1};
    if (!data || !g) { toast("That couldn't be added. Ask them to send it again."); return; }
    if (r.kind === "deck") {
      const p = g.cleanPayload(data); if (!p) { toast("That deck couldn't be read. Ask them to send it again."); return; }
      p.name = String(r.title || p.name).slice(0, 120);
      g.addDeckCopy(p, meta, g.matchCourse(p.course), null, false);
      return;
    }
    if (r.kind === "quiz") {
      const cq = g.cleanQuizPayload(data); if (!cq || !cq.quiz.questions.length) { toast("That quiz couldn't be read. Ask them to send it again."); return; }
      g.addDeckCopy({name: String(r.title || cq.quiz.title || "Practice Quiz").slice(0, 120), cards: [], quizzes: [cq.quiz]}, Object.assign({q: 1}, meta), g.matchCourse(cq.course),
        nd => { toast(`Added ${r.title} to your quizzes`, null, nd && nd.aiQuizzes && nd.aiQuizzes[0] && typeof startAiQuiz === "function" ? {label: "Take It", fn: () => startAiQuiz(nd.id, nd.aiQuizzes[0].id)} : null); }, true);
      return;
    }
    if (r.kind === "map") {
      const rec = window.SBCMAPG && SBCMAPG.friendRec ? SBCMAPG.friendRec(data) : null;
      if (!rec || !window.SBCMAP || !SBCMAP.addMapCopy) { toast("That map couldn't be read. Ask them to send it again."); return; }
      if (r.title) rec.name = String(r.title).slice(0, 80);
      try {
        const w = SBCMAP.addMapCopy(rec, data.course, `Added ${rec.name} from ${by}`);
        toast(`Added ${rec.name} to ${w.where}`, null, {label: "Open", fn: () => SBCMAP.open("course", w.course, w.map)});
      } catch (e) { toast(e.message || "Couldn't add the map."); }
    }
  }
  // Online: hear about a new one the moment it's sent
  function listen(){
    const c = cli(); if (S.chan && c && c.removeChannel) { try { c.removeChannel(S.chan); } catch (e) {} } S.chan = null;
    if (!c || !c.channel || !me()) return;
    try {
      S.chan = c.channel("friend-shares-" + me().id).on("postgres_changes", {event: "INSERT", schema: "public", table: "friend_shares", filter: "to_user=eq." + me().id}, () => setTimeout(check, 400)).subscribe();
    } catch (e) { S.chan = null; }
  }

  // When it opens, when it comes back to the front, and every minute while it's in front (in case the live note was missed)
  hook("boot", () => setTimeout(check, 2500));
  document.addEventListener("visibilitychange", () => { if (!document.hidden && Date.now() - S.at > 15000) check(); });
  setInterval(() => { if (!document.hidden && (S.uid !== ((me() || {}).id || "") || Date.now() - S.at > 60000)) check(); }, 20000);
  hook("act", (act, el) => {
    if (act !== "fs-send") return false;
    send(el.dataset.kind, el.dataset.ref || el.dataset.id || "");
    return true;
  });
  window.SBFSHARE = {send, check, T: {FS, payloadOf}};
})();
