/* ===== module: 97-sharing.js ===== */
/* Public share links and the Course Library */
(() => {
  const G = () => (window.SBGROUPS && window.SBGROUPS.share) || null;
  const can = () => !inPreview() && !!G() && !!(window.__sbShareStub || sb || sbConfig() || SB_HOSTED);
  const signedIn = () => { const g = G(); return !!(g && g.online()); };
  const clip = (v, n) => String(v == null ? "" : v).slice(0, n);
  const plural = (n, one, many) => `${Number(n) || 0} ${Number(n) === 1 ? one : many || one + "s"}`;
  const ago = t => { const d = Math.floor((Date.now() - new Date(t).getTime()) / 864e5); return !isFinite(d) ? "a while ago" : d <= 0 ? "today" : d === 1 ? "yesterday" : d < 30 ? `${d} days ago` : `on ${new Date(t).toLocaleDateString()}`; };

  /* Talking to the server (works signed out too) */
  function shErr(e){
    const m = String((e && (e.message || e.details)) || e || ""), code = String((e && e.code) || "");
    if (/fetch|network|Load failed|timed? ?out/i.test(m)) return new Error("Couldn't reach Studyboard. Check your internet connection and try again.");
    if (["42P01", "42883", "42703", "PGRST202", "PGRST205", "PGRST204"].includes(code) || /does not exist|Could not find the (function|table)|schema cache/i.test(m))
      return Object.assign(new Error(srvSetup("Public links and the Course Library", "supabase-sharing.sql")), {setup: true});
    if (/JWT|not authenticated|Sign in first/i.test(m)) return new Error("Sign in to Studyboard first, then try again.");
    return new Error(m.replace(/^SB_[A-Z_]+:\s*/, "") || "Something went wrong. Try again.");
  }
  async function rpc(fn, args){
    if (window.__sbShareStub) return window.__sbShareStub(fn, args || {});
    const g = G(), c = g && g.online() ? g.cli() : sb;
    if (c) { const {data, error} = await c.rpc(fn, args || {}); if (error) throw shErr(error); return data; }
    const cfg = sbConfig() || (SB_HOSTED ? SB_DEFAULT : null);
    if (!cfg) throw new Error("Opening shared links needs the internet and the Studyboard website.");
    let r = null;
    try { r = await fetch(cfg.url.replace(/\/+$/, "") + "/rest/v1/rpc/" + fn, {method: "POST", headers: {apikey: cfg.key, "content-type": "application/json"}, body: JSON.stringify(args || {})}); }
    catch (e) { throw shErr(e); }
    const j = await r.json().catch(() => null);
    if (!r.ok) throw shErr(Object.assign({}, j || {}, {message: (j && j.message) || "HTTP " + r.status}));
    return j;
  }
  const rows = x => Array.isArray(x) ? x : x ? [x] : [];

  /* Sheets */
  const msgSheet = (title, msg) => openSheet(`<div class="sheet">${head(title)}<div class="sheet-body"><p style="margin:0">${esc(msg)}</p></div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-act="close">OK</button></div></div>`);
  const waitSheet = title => openSheet(`<div class="sheet">${head(title)}<div class="sheet-body"><p class="mini" style="margin:0" role="status">Opening…</p></div></div>`);
  function band(course, name, sub){
    const cid = G().matchCourse(course), c = courseOf(cid);
    return `<div class="grp-prev" id="shBand" style="--c:${esc(cid ? colorOf(cid) : "#8A94A6")}"><span class="deck-tab">${c ? `<span class="gp-ic" aria-hidden="true">${courseRingHtml(c)}</span>` : ""}<span class="gp-t">${esc(c ? courseLabel(c) : (course && (course.code || course.name)) || "General")}</span></span>
      <b class="grp-prev-name">${esc(name)}</b><span class="mini">${sub}</span></div>`;
  }
  const byLine = row => row.sharer_name ? ` · Shared by ${esc(row.sharer_name)}` : "";
  const reportBtn = row => row.is_mine ? "" : `<button type="button" class="btn" data-act="share-report" data-id="${esc(row.code)}">Report</button>`;
  const copyOf = code => decksArr().find(d => d.sharedFrom && d.sharedFrom.code === code);
  const saved = code => { if (signedIn()) rpc("share_saved", {p_code: code}).catch(() => {}); };

  /* Opening a link */
  async function open(code){
    if (!G()) return;
    waitSheet("Shared With You");
    let row = null;
    try { row = rows(await rpc("get_public_share", {p_code: code}))[0] || null; }
    catch (e) { if (dlg.open) msgSheet("Shared With You", e.message); return; }
    if (!dlg.open) return;
    if (!row) { msgSheet("Shared With You", "That link doesn't work any more. The person may have stopped sharing it. Ask them for a new one."); return; }
    if (row.kind === "board") { if (window.SBWB && SBWB.shareView) SBWB.shareView(row, {band, byLine, reportBtn, saved, msgSheet}); else msgSheet("Shared Whiteboard", "Update Studyboard to open shared whiteboards."); return; }
    if (row.kind === "quiz") quizView(row); else if (row.kind === "note") noteView(row); else deckView(row);
  }

  function deckView(row){
    const g = G(), p = g.cleanPayload(row.data);
    if (!p || (!p.cards.length && !p.quizzes.length)) { msgSheet("Shared Deck", "That deck couldn't be read. Ask the person to share it again."); return; }
    p.name = clip(row.name, 120) || p.name;
    const cards = p.cards.filter(c => c.front || c.back), have = copyOf(row.code), nq = p.quizzes.length;
    let i = 0, back = false;
    openSheet(`<div class="sheet sh-view">${head("Shared Deck")}<div class="sheet-body">
      ${band(p.course, p.name, `${plural(p.cards.length, "card")}${nq ? `, ${plural(nq, "practice quiz", "practice quizzes")}` : ""}${byLine(row)}`)}
      ${cards.length ? `<button type="button" class="sh-card" id="shCard"></button>
      <div class="sh-nav"><button type="button" class="btn small" id="shPrev">Previous</button><span class="mini" id="shPos" aria-live="polite"></span><button type="button" class="btn small" id="shNext">Next</button></div>` : ""}
      ${row.is_mine ? `<div class="grp-note">This is your own shared deck. Adding it makes a second copy.</div>` : have ? `<div class="grp-note">You already have this deck (${esc(have.name)}).</div>` : ""}
      ${coursesArr().length ? `<label class="f">Put It In<select id="shCourse">${courseSelectHtml(g.matchCourse(p.course))}</select></label>` : ""}
      <p class="mini" style="margin:0">Add it to get your own copy, with each card brought back just before you'd forget it.${signedIn() ? "" : " No account needed."}</p></div>
      <div class="sheet-foot">${reportBtn(row)}<span class="spacer"></span>${have ? `<button type="button" class="btn" id="shOpen">Open My Copy</button>` : `<button type="button" class="btn" data-act="close">Close</button>`}<button type="button" class="btn primary" id="shAdd">${have ? "Add Again" : "Study This in Studyboard"}</button></div></div>`);
    const draw = () => {
      const el = $("#shCard"); if (!el) return;
      const c = cards[i];
      el.className = "sh-card" + (back ? " is-back" : "");
      el.innerHTML = `<span class="sh-side">${back ? "Back" : "Front"}</span><span class="sh-txt">${esc(back ? c.back : c.front)}</span><span class="sh-tap mini">${back ? "Tap to see the front" : "Tap to flip"}</span>`;
      el.setAttribute("aria-label", `Card ${i + 1} of ${cards.length}, ${back ? "back" : "front"}: ${back ? c.back : c.front}. Press to flip.`);
      $("#shPos").textContent = `${i + 1} of ${cards.length}`;
      $("#shPrev").disabled = i === 0; $("#shNext").disabled = i >= cards.length - 1;
    };
    const move = d => { const j = Math.max(0, Math.min(cards.length - 1, i + d)); if (j !== i) { i = j; back = false; draw(); } };
    if (cards.length) {
      draw();
      $("#shCard").addEventListener("click", () => { back = !back; draw(); });
      $("#shPrev").addEventListener("click", () => move(-1));
      $("#shNext").addEventListener("click", () => move(1));
      dlg.querySelector(".sh-view").addEventListener("keydown", e => { if (e.target.closest("input,textarea,select")) return; if (e.key === "ArrowRight") { move(1); e.preventDefault(); } else if (e.key === "ArrowLeft") { move(-1); e.preventDefault(); } });
    }
    const op = $("#shOpen"); if (op) op.addEventListener("click", () => { dlg.close(); ui.tab = "flashcards"; ui.fc = null; ui.deckId = have.id; render(); window.scrollTo(0, 0); });
    const pick = $("#shCourse"), bandEl = $("#shBand");
    if (pick && bandEl) pick.addEventListener("change", () => { const c2 = courseOf(pick.value);
      bandEl.style.setProperty("--c", c2 ? colorOf(c2.id) : "#8A94A6");
      const tab = $(".deck-tab", bandEl); tab.innerHTML = (c2 ? `<span class="gp-ic" aria-hidden="true">${courseRingHtml(c2)}</span>` : "") + `<span class="gp-t">${esc(c2 ? courseLabel(c2) : "General")}</span>`; });
    $("#shAdd").addEventListener("click", () => {
      const into = pick ? pick.value : g.matchCourse(p.course);
      dlg.close();
      g.addDeckCopy(p, {code: row.code, by: row.sharer_name, v: row.updated_at, pub: 1}, into);
      saved(row.code);
    });
  }

  function quizView(row){
    const g = G(), cq = g.cleanQuizPayload(row.data);
    if (!cq || !cq.quiz.questions.length) { msgSheet("Shared Quiz", "That quiz couldn't be read. Ask the person to share it again."); return; }
    const qz = cq.quiz, n = qz.questions.length, title = clip(row.name, 120) || qz.title || "Practice Quiz", have = copyOf(row.code);
    const kinds = [...new Set(qz.questions.map(x => ({single: "multiple choice", multiple: "select all", truefalse: "true or false", order: "put in order", short: "short answer"})[x.type] || "multiple choice"))];
    openSheet(`<div class="sheet sh-view">${head("Shared Quiz")}<div class="sheet-body">
      ${band(cq.course, title, `${plural(n, "question")}${byLine(row)}`)}
      <p style="margin:0">${qz.kind === "case" ? "A case study with questions" : "Questions"}: ${esc(kinds.join(", "))}. You'll see your score and an explanation for each answer.</p>
      <div class="sh-q"><span class="mini">First question</span><b>${esc(qz.kind === "case" && qz.scenario ? qz.scenario.slice(0, 220) + (qz.scenario.length > 220 ? "…" : "") : qz.questions[0].stem)}</b></div>
      ${row.is_mine ? `<div class="grp-note">This is your own shared quiz.</div>` : ""}
      <p class="mini" style="margin:0">Taking it adds the quiz to your Studyboard so you can retake it any time.${signedIn() ? "" : " No account needed."}</p></div>
      <div class="sheet-foot">${reportBtn(row)}<span class="spacer"></span><button type="button" class="btn" data-act="close">Close</button><button type="button" class="btn primary" id="shTake">Take the Quiz</button></div></div>`);
    $("#shTake").addEventListener("click", () => {
      dlg.close();
      const run = nd => { if (nd && nd.aiQuizzes && nd.aiQuizzes[0]) startAiQuiz(nd.id, nd.aiQuizzes[0].id); };
      if (have && have.aiQuizzes && have.aiQuizzes[0]) { run(have); return; }
      g.addDeckCopy({name: title, cards: [], quizzes: [qz]}, {code: row.code, by: row.sharer_name, v: row.updated_at, q: 1, pub: 1}, g.matchCourse(cq.course), run, true);
      saved(row.code);
    });
  }

  const linkText = t => String(t || "").replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (m, a, b) => (b || a).trim());
  function noteView(row){
    const d = row.data && typeof row.data === "object" ? row.data : {}, text = clip(d.text, 8000);
    if (!text.trim()) { msgSheet("Shared Note", "That note couldn't be read. Ask the person to share it again."); return; }
    const course = d.course && typeof d.course === "object" ? {code: clip(d.course.code, 40), name: clip(d.course.name, 120)} : null;
    openSheet(`<div class="sheet sh-view">${head("Shared Note")}<div class="sheet-body">
      ${band(course, clip(row.name, 120) || "Note", byLine(row).replace(/^ · /, "") || "A shared note")}
      <div class="sh-note" tabindex="0">${esc(linkText(text))}</div>
      ${row.is_mine ? `<div class="grp-note">This is your own shared note.</div>` : ""}</div>
      <div class="sheet-foot">${reportBtn(row)}<span class="spacer"></span><button type="button" class="btn" data-act="close">Close</button><button type="button" class="btn primary" id="shSave">Save to My Notes</button></div></div>`);
    $("#shSave").addEventListener("click", () => {
      dlg.close();
      const z = notesArr().reduce((m, n) => Math.max(m, n.z || 0), 0) + 1;
      const color = ["yellow", "blue", "green", "pink", "orange", "purple"].includes(d.color) ? d.color : "yellow";
      const n = normNote({id: uid(), text, color, x: 40 + Math.round(Math.random() * 80), y: 40 + Math.round(Math.random() * 60), z, rot: 0, courseId: G().matchCourse(course), sharedFrom: {code: row.code, by: clip(row.sharer_name, 40)}});
      applyChanges([{kind: "note", id: n.id, after: n}], "Saved to your Notes");
      ui.tab = "notes"; render(); window.scrollTo(0, 0);
      saved(row.code);
    });
  }

  /* Reporting */
  const REASONS = [["spam", "Spam or ads"], ["cheating", "Answers to a graded test or assignment"], ["harassment", "Bullying or harassment"], ["hate", "Hate"], ["sexual", "Sexual content"], ["privacy", "Someone's private information"], ["threat", "Threats or violence"], ["other", "Something else"]];
  function reportSheet(code){
    if (!signedIn()) { toast("Sign in to report this. Thank you for keeping Studyboard safe."); return; }
    openSheet(`<form class="sheet">${head("Report This")}<div class="sheet-body">
      <fieldset class="sh-reasons"><legend class="mini">What's wrong with it?</legend>${REASONS.map(([k, l], i) => `<label class="mi-check"><input type="radio" name="reason" value="${k}" ${i ? "" : "checked"}> ${esc(l)}</label>`).join("")}</fieldset>
      <label class="f">More Details <span class="hint">optional</span><textarea name="details" rows="2" maxlength="500"></textarea></label>
      <p class="mini" style="margin:0">We review reports and remove what breaks the rules. The person isn't told who reported it.</p></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="submit" class="btn primary" data-submit>Send Report</button></div></form>`, fd => {
      rpc("report_share", {p_code: code, p_reason: String(fd.get("reason") || "other"), p_details: String(fd.get("details") || "")})
        .then(() => toast("Thanks. We'll review it soon.")).catch(e => toast(e.message));
    });
  }

  /* Sharing your own note or quiz */
  function srcOf(kind, ref){
    const g = G();
    if (kind === "board") return window.SBWB && SBWB.shareSrc ? SBWB.shareSrc(ref, g) : null;
    if (kind === "note") {
      const n = state.notes && state.notes[ref]; if (!n || !String(n.text || "").trim()) return null;
      const c = courseOf(n.courseId), data = {v: 1, type: "note", text: clip(n.text, 8000), color: n.color || "yellow", course: c ? {code: c.code || "", name: c.name || ""} : null};
      const title = (String(n.text).split("\n").map(l => linkText(l).trim()).find(l => /[\p{L}\p{N}]/u.test(l)) || "Note").slice(0, 120);
      return {title, data, h: g.hashOf(JSON.stringify(data)), mark: m => { const nn = clone(n); if (m) nn.shared = m; else delete nn.shared; applyChanges([{kind: "note", id: n.id, after: nn}], ""); }, cur: () => (state.notes[ref] || {}).shared};
    }
    const [did, qid] = String(ref).split(":"), d = state.decks[did], qz = d && (d.aiQuizzes || []).find(x => x.id === qid);
    if (!qz) return null;
    const data = g.quizPayload(qz, d.courseId);
    return {title: clip(qz.title, 200) || "Practice Quiz", data, h: data.hash, cur: () => { const dd = state.decks[did], x = dd && (dd.aiQuizzes || []).find(y => y.id === qid); return x && x.shared; },
      mark: m => { const nd = clone(state.decks[did]), x = (nd.aiQuizzes || []).find(y => y.id === qid); if (!x) return; if (m) x.shared = m; else delete x.shared; saveDeck(nd, null); }};
  }
  function signInSheet(title, text){
    openSheet(`<div class="sheet">${head(title)}<div class="sheet-body"><p style="margin:0">${esc(text)}</p></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Not Now</button>${window.SBGUEST || typeof sbSignInSheet === "function" ? `<button type="button" class="btn primary" id="shSignIn">Sign In</button>` : ""}</div></div>`);
    const b = $("#shSignIn"); if (b) b.addEventListener("click", () => { dlg.close(); if (window.SBGUEST && SBGUEST.signUp) SBGUEST.signUp(); else if (typeof sbSignInSheet === "function") sbSignInSheet(); });
  }
  function shareRef(kind, ref){
    const g = G(); if (!g) return;
    if (kind === "deck") { const d = state.decks[ref]; if (d) g.deckShareSheet(d); return; }
    if (!srcOf(kind, ref)) { toast(kind === "note" ? "Write something in the note first" : kind === "board" ? "Draw something on the board first" : "That quiz isn't here any more"); return; }
    if (!signedIn()) { signInSheet(kind === "note" ? "Share Note" : kind === "board" ? "Share Whiteboard" : "Share Quiz", "Sign in to make a link anyone can open. A free account is all it takes."); return; }
    g.rememberWebUrl();
    g.ensureName(() => itemSheet(kind, ref));
  }
  const decodeRef = code => { for (const d of decksArr()) for (const q of (d.aiQuizzes || [])) if (q.shared && q.shared.code === code) return d.id + ":" + q.id; return ""; };
  async function itemSheet(kind, ref){
    const g = G(), what = kind === "note" ? "note" : kind === "board" ? "whiteboard" : "quiz", title = kind === "note" ? "Share Note" : kind === "board" ? "Share Whiteboard" : "Share Quiz";
    let src = srcOf(kind, ref); if (!src) return;
    g.loadingSheet(title);
    let row = null;
    try { row = rows(await rpc("my_shared_items")).find(x => x.kind === kind && x.ref_id === ref) || null; }
    catch (e) { if (dlg.open) msgSheet(title, e.message); return; }
    if (!dlg.open) return;
    src = srcOf(kind, ref); if (!src) { dlg.close(); return; }
    if (!row) {
      openSheet(`<div class="sheet">${head(title)}<div class="sheet-body">
        <p style="margin:0">Make a link for this ${what}. Anyone with the link can ${kind === "note" ? "read it" : kind === "board" ? "see it" : "take it"} in a browser, no account needed, and save their own copy.${kind === "board" ? " It's a copy: your changes after this show up for them when you update the link." : ""}${kind === "note" ? " Only the text is shared, not photos or stickers." : " They get the questions, not your scores."}</p>
        <p class="mini" style="margin:0">They'll see your name as <b>${esc(g.myName())}</b>. You can update it or stop sharing any time.</p></div>
        <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" id="shMake">Create Link</button></div></div>`);
      $("#shMake").addEventListener("click", e => make(kind, ref, e.currentTarget));
      return;
    }
    const link = g.linkFor("shared", row.code), mine = src.cur(), changed = !mine || mine.code !== row.code || mine.h !== src.h;
    openSheet(`<div class="sheet">${head(title)}<div class="sheet-body">
      <p style="margin:0">Send the link. It opens in any browser.</p>
      <div class="grp-code-big" aria-label="Share code">${esc(row.code)}</div>
      ${link ? `<div class="grp-link"><input type="text" readonly value="${esc(link)}" aria-label="Share link" id="shLinkIn"><button type="button" class="btn small" id="shCopy">Copy Link</button></div>` : ""}
      <p class="mini" style="margin:0">Shared ${esc(ago(row.updated_at))}${row.saves ? `. ${plural(row.saves, "person", "people")} saved a copy` : ""}.</p>
      ${kind === "quiz" ? pubRow("quiz", row.code, src.title) : ""}
      ${row.hidden ? `<div class="grp-note">This link is paused while a report is reviewed.</div>` : changed ? `<div class="grp-note">You've changed this ${what} since you shared it. Update the shared copy so new people get the latest.</div>` : ""}
      <div class="grp-sub"><button type="button" class="link-btn grp-stop" id="shStop">Stop Sharing</button></div></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn${changed ? " primary" : ""}" id="shUpd">Update Shared Copy</button>${changed ? "" : `<button type="button" class="btn primary" id="shSend">Send</button>`}</div></div>`);
    const cp = $("#shCopy"); if (cp) cp.addEventListener("click", () => g.copyText(link, "Link copied"));
    const li = $("#shLinkIn"); if (li) li.addEventListener("focus", () => li.select());
    const sd = $("#shSend"); if (sd) sd.addEventListener("click", () => g.sendText(src.title, `${kind === "note" ? "Read my Studyboard note" : kind === "board" ? "See my Studyboard whiteboard" : "Try my Studyboard quiz"} "${src.title}"`, link));
    $("#shUpd").addEventListener("click", e => make(kind, ref, e.currentTarget));
    $("#shStop").addEventListener("click", async () => {
      if (!(await askBox({title: "Stop Sharing?", text: `The link stops working. People who saved a copy keep it.`, yes: "Stop Sharing", danger: true}))) return;
      try { await rpc("stop_share_item", {p_code: row.code}); const s2 = srcOf(kind, ref); if (s2) s2.mark(null); if (dlg.open) dlg.close(); toast("Stopped sharing. The link no longer works."); }
      catch (e) { toast(e.message); }
    });
  }
  async function make(kind, ref, btn){
    const g = G(), src = srcOf(kind, ref); if (!src) return;
    g.busyBtn(btn, true);
    try {
      const code = String(await rpc("share_item", {p_kind: kind, p_ref: ref, p_title: src.title, p_data: src.data}));
      const had = src.cur();
      src.mark({code, h: src.h, at: Date.now()});
      toast(had && had.code === code ? "Shared copy updated" : `Link ready. Code ${code}`);
      itemSheet(kind, ref);
    } catch (e) { g.busyBtn(btn, false); toast(e.message); }
  }

  /* Your school */
  function hostKey(h){
    h = String(h || "").toLowerCase().replace(/^https?:\/\//, "").split(/[/:?#]/)[0];
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(h)) return "";
    const parts = h.split(".");
    if (/(^|\.)(instructure\.com|brightspace\.com|blackboard\.com|d2l\.com|desire2learn\.com)$/.test(h)) return parts.slice(-3).join(".");
    const sl = parts[parts.length - 2];
    return parts.slice(parts.length >= 3 && ["ac", "edu", "co", "com", "org", "net", "gov", "sch"].includes(sl) ? -3 : -2).join(".");
  }
  const nameKey = s => String(s || "").toLowerCase().replace(/[^a-z0-9 .&'-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
  function schoolOf(){
    const st = state.settings || {};
    if (st.school && st.school.key) return {key: st.school.key, name: st.school.name || st.school.key};
    for (const k of ["brightspace", "canvas", "blackboard"]) { const key = hostKey(st[k] && st[k].host); if (key) return {key, name: key, auto: true}; }
    return null;
  }
  // Your school, picked from the list of real schools (supabase-schools.sql)
  const lmsHosts = () => { const st = state.settings || {}; return ["brightspace", "canvas", "blackboard"].map(k => [k, st[k] && st[k].host]).filter(x => x[1]); };
  const LMS_NAME = {brightspace: "Brightspace", canvas: "Canvas", blackboard: "Blackboard"};
  let autoTried = "";
  async function autoSchool(){
    const hs = lmsHosts(), sig = hs.map(x => x[1]).join(",");
    if (!hs.length || autoTried === sig) return null;
    autoTried = sig;
    for (const [k, h] of hs) {
      try { const r = rows(await rpc("school_for_host", {p_host: h}))[0]; if (r) return Object.assign({from: LMS_NAME[k]}, r); } catch (e) { return null; }
    }
    return null;
  }
  async function keepSchool(sc, quiet){
    state.settings = Object.assign({}, state.settings, {school: {key: sc.key, name: sc.name, country: sc.country || "", region: sc.region || "", kind: sc.kind || "university", v: 1}}); saveSettings();
    COUNTS.at = 0;
    if (signedIn()) { try { await rpc("set_my_school", {p_key: sc.key}); } catch (e) { if (!quiet) toast(e.message); return false; } }
    return true;
  }
  // Fill it in by itself when a school site is connected and nothing was picked yet
  setTimeout(async () => { try { const st = state.settings || {}; if (!can() || (st.school && st.school.v)) return; const sc = await autoSchool(); if (sc && !((state.settings || {}).school || {}).v) keepSchool(sc, true); } catch (e) {} }, 4000);
  let schKind = "university";
  function schoolSheet(then, why){
    const cur = schoolOf(), curV = cur && ((state.settings || {}).school || {}).v ? cur : null;
    if (curV && ((state.settings || {}).school || {}).kind === "high_school") schKind = "high_school";
    openSheet(`<div class="sheet sch-sheet">${head("Your School")}<div class="sheet-body">
      <p style="margin:0">${esc(why || "Pick your school from the list. Course codes repeat between schools, so classmates find your decks by school.")}</p>
      <div class="segb sch-kind" role="group" aria-label="Kind of school"><button type="button" data-k="university" aria-pressed="${schKind === "university"}">University or College</button><button type="button" data-k="high_school" aria-pressed="${schKind === "high_school"}">High School</button></div>
      <div id="schAuto"></div>
      <label class="f"><span id="schQL">Search for Your ${schKind === "high_school" ? "High School" : "School"}</span><input type="search" id="schQ" maxlength="80" autocomplete="off" placeholder="${schKind === "high_school" ? "e.g. Lisgar Collegiate or a school and its city" : "e.g. University of Waterloo or uwaterloo.ca"}" value=""></label>
      <p class="mini" id="schHsNote" style="margin:0"${schKind === "high_school" ? "" : " hidden"}>High schools in the United States, Ontario and British Columbia are listed. Pages you publish show "High school" and your province or state, not the school's name.</p>
      <div id="schList" class="sch-list" role="listbox" aria-label="Schools"></div>
      ${curV ? `<p class="mini" style="margin:0">Now: <b>${esc(curV.name)}</b></p>` : ""}
      <button type="button" class="link-btn" id="schMissing">Can't find your school?</button></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button></div></div>`);
    const pick = async sc => {
      if (!(await keepSchool(sc))) return;
      if (dlg.open) dlg.close();
      toast(`School set: ${sc.name}`);
      if (then) setTimeout(then, 0);
    };
    const item = sc => `<button type="button" class="sch-item" role="option" data-key="${esc(sc.key)}"><b>${esc(sc.name)}</b><span class="mini">${esc([sc.city, sc.region, sc.country].filter(Boolean).join(", "))}${sc.key && !/[#:]/.test(sc.key) ? ` · ${esc(sc.key)}` : ""}</span></button>`;
    let last = [], seq = 0, t = 0;
    const list = $("#schList");
    list.addEventListener("click", e => { const b = e.target.closest(".sch-item"); if (!b) return; const sc = last.find(x => x.key === b.dataset.key); if (sc) pick(sc); });
    const search = async () => {
      const q = $("#schQ") ? $("#schQ").value.trim() : ""; const my = ++seq;
      if (q.length < 2) { list.innerHTML = ""; return; }
      list.innerHTML = `<p class="mini" style="margin:0">Searching…</p>`;
      try { const r = rows(await rpc("search_schools", {p_q: q, p_limit: 15, p_kind: schKind})); if (my !== seq || !$("#schList")) return; last = r;
        list.innerHTML = r.length ? r.map(item).join("") : `<p class="mini" style="margin:0">No school by that name. Try its full name or web address, or tap Can't find your school.</p>`; }
      catch (e) { if (my === seq && $("#schList")) list.innerHTML = `<p class="grp-note" style="margin:0">${esc(e.message)}</p>`; }
    };
    $("#schQ").addEventListener("input", () => { clearTimeout(t); t = setTimeout(search, 220); });
    dlg.querySelectorAll(".sch-kind [data-k]").forEach(b => b.addEventListener("click", () => {
      schKind = b.dataset.k;
      dlg.querySelectorAll(".sch-kind [data-k]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      $("#schQL").textContent = schKind === "high_school" ? "Search for Your High School" : "Search for Your School";
      $("#schQ").placeholder = schKind === "high_school" ? "e.g. Lisgar Collegiate or a school and its city" : "e.g. University of Waterloo or uwaterloo.ca";
      $("#schHsNote").hidden = schKind !== "high_school"; const au = $("#schAuto"); if (au) au.hidden = schKind === "high_school";
      search(); $("#schQ").focus();
    }));
    setTimeout(() => { const q = $("#schQ"); if (q) q.focus(); }, 60);
    (async () => {
      autoTried = "";
      const sc = await autoSchool(); const box = $("#schAuto"); if (!sc || !box || (curV && curV.key === sc.key)) return;
      box.innerHTML = `<div class="sch-auto"><span><span class="mini">From your ${esc(sc.from)} sign-in</span><b>${esc(sc.name)}</b></span><button type="button" class="btn small primary" id="schUseAuto">Use This School</button></div>`;
      $("#schUseAuto").addEventListener("click", () => pick(sc));
    })();
    $("#schMissing").addEventListener("click", () => {
      if (!signedIn()) { toast("Sign in to ask us to add your school."); return; }
      openSheet(`<form class="sheet">${head("Add Your School")}<div class="sheet-body">
        <p style="margin:0">Tell us your school and we'll add it to the list, usually within a few days. Until then, publishing waits.</p>
        <label class="f">School Name ${REQ}<input name="name" required maxlength="160" autocomplete="organization"></label>
        <label class="f">Country<input name="country" maxlength="80" autocomplete="country-name"></label>
        <label class="f">Website<input name="web" maxlength="200" placeholder="e.g. example.edu" inputmode="url"></label></div>
        <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="submit" class="btn primary" data-submit>Send</button></div></form>`, fd => {
        rpc("request_school", {p_name: String(fd.get("name") || ""), p_country: String(fd.get("country") || ""), p_website: String(fd.get("web") || "")})
          .then(() => toast("Thanks. We'll add your school soon.")).catch(e => toast(e.message));
      });
    });
  }
  // Publishing needs a school from the list, also on the server
  async function ensureSchool(then){
    const st = (state.settings || {}).school;
    if (st && st.v && st.key) { if (await keepSchool(st, false)) then(st); return; }
    schoolSheet(() => { const s2 = (state.settings || {}).school; if (s2 && s2.v) then(s2); }, "Pick your school before publishing. Your school shows on the public page, so students searching for your courses find it.");
  }

  /* The Publish button on a deck */
  const PUB_IC = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>';
  hook("render", tab => {
    if (tab !== "flashcards" || ui.fc || !ui.deckId || !can()) return;
    const d = state.decks[ui.deckId], ra = $("#view .deck-head .row-actions"); if (!d || !ra || $('[data-act="pub-deck"]', ra)) return;
    if (notMine(d) && !(d.published && d.published.code)) return;
    const html = `<button class="btn" data-act="pub-deck" data-id="${esc(d.id)}">${PUB_IC}${d.published && d.published.code ? "Published" : "Publish"}</button>`;
    const sh = $('[data-act="grp-deck-share"]', ra); if (sh) sh.insertAdjacentHTML("afterend", html); else ra.insertAdjacentHTML("beforeend", html);
  });
  // Only your own decks can be published
  const notMine = d => !!(d && d.sharedFrom);
  const notMineText = (d, plain) => { const by = d && d.sharedFrom && d.sharedFrom.by ? String(d.sharedFrom.by).slice(0, 60) : ""; const t = `You can only publish decks you made. ${by ? by + " made this one" : "This one is a copy of someone else's deck"}, so it stays in your Studyboard just for you.`; return plain ? t : esc(t); };
  function publishDeck(id){
    const g = G(), d = state.decks[id]; if (!g || !d) return;
    if (notMine(d) && !(d.published && d.published.code)) { msgSheet("Not Your Deck", notMineText(d, true)); return; }
    if (!signedIn()) { signInSheet("Publish Deck", "Sign in to publish your deck. A free account is all it takes."); return; }
    const n = d.cards.filter(c => !c.draft && String(c.front || "").trim() && String(c.back || "").trim()).length;
    if (d.published && d.published.code) { managePub(id); return; }
    if (n < 4) { toast("A deck needs at least 4 cards to be published."); return; }
    g.rememberWebUrl();
    g.ensureName(() => withUsername(() => ensureSchool(sc => confirmPub(id, sc))));
  }
  const withUsername = then => { if (window.SBUNAME) SBUNAME.ensure(() => SBUNAME.ensureAge(() => then())); else then(); };
  const madeBy = () => (window.SBUNAME && SBUNAME.cached() ? "@" + SBUNAME.cached() : G().myName() || "You");
  /* The colour and icon of the deck on its public page */
  const PUB_GENERAL = "#5E6B7E";
  const hexRgb = h => [1, 3, 5].map(i => parseInt(String(h).slice(i, i + 2), 16) || 0);
  const nearColor = h => { if (!/^#[0-9a-f]{6}$/i.test(h || "")) return COURSE_COLORS[0]; const a = hexRgb(h); let best = COURSE_COLORS[0], bd = 1e9;
    COURSE_COLORS.forEach(x => { const b = hexRgb(x), dd = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2; if (dd < bd) { bd = dd; best = x; } }); return best; };
  const okLook = l => !!(l && COURSE_COLORS.includes(l.color) && (l.icon === "general" || COURSE_ICONS[l.icon]));
  function lookOf(d){
    if (okLook(d.pubLook)) return {color: d.pubLook.color, icon: d.pubLook.icon};
    const c = courseOf(d.courseId); if (!c) return {color: PUB_GENERAL, icon: "general"};
    const k = courseIconKey(c); return {color: nearColor(c.color), icon: COURSE_ICONS[k] ? k : "note"};
  }
  const lookIcon = k => k === "general" ? GENERAL_ICON : courseIconSvg(k);
  function lookTile(d, L){
    const c = courseOf(d.courseId), n = d.cards.filter(x => !x.draft).length;
    return `<article class="deck deck-fc cs-index pub-look-tile" id="pubLookTile" style="--c:${esc(L.color)}" aria-label="How it looks on the page">
      <span class="deck-lay l3" aria-hidden="true"><span class="face"></span></span><span class="deck-lay l2" aria-hidden="true"><span class="face"></span></span>
      <span class="deck-count" aria-hidden="true">${n}</span>
      <div class="face deck-face"><span class="fc-band" aria-hidden="true"><span class="fc-ic">${lookIcon(L.icon)}</span><span class="g2-kick">${esc(c ? courseLabel(c) : "General")}</span></span>
      <div class="deck-main"><span class="deck-name">${esc(d.name)}</span></div></div></article>`;
  }
  function lookFields(L){
    return `<fieldset class="pub-look-fs"><legend>Color</legend><div class="swatches cc-sw">${COURSE_COLORS.map((x, i) => `<label><input type="radio" name="pubColor" value="${x}" ${x === L.color ? "checked" : ""} aria-label="${esc(COURSE_COLOR_NAMES[i] || "Color " + (i + 1))}"><span style="--c:${x}"></span></label>`).join("")}</div></fieldset>
      <fieldset class="pub-look-fs ci-fs"><legend>Icon</legend><div class="ci-grid pub-look-ic" style="--c:${esc(L.color)}">
        <label><input type="radio" name="pubIcon" value="general" ${L.icon === "general" ? "checked" : ""} aria-label="Cards"><span>${GENERAL_ICON}</span></label>${Object.keys(COURSE_ICONS).map(k => `<label><input type="radio" name="pubIcon" value="${k}" ${L.icon === k ? "checked" : ""} aria-label="${esc(COURSE_ICONS[k][0])}"><span>${courseIconSvg(k)}</span></label>`).join("")}</div></fieldset>`;
  }
  // Keeps the preview in step with the picks; returns a getter for the picked look
  function wireLook(root, L){
    const cur = Object.assign({}, L);
    root.addEventListener("change", e => {
      const t = e.target; if (t.name === "pubColor") cur.color = t.value; else if (t.name === "pubIcon") cur.icon = t.value; else return;
      const tile = $("#pubLookTile", root); if (tile) { tile.style.setProperty("--c", cur.color); $(".fc-ic", tile).innerHTML = lookIcon(cur.icon); }
      const g = $(".pub-look-ic", root); if (g) g.style.setProperty("--c", cur.color);
    });
    return () => cur;
  }
  // From the Published sheet
  function lookSheet(id){
    const d = state.decks[id]; if (!d) return; const L = lookOf(d);
    openSheet(`<div class="sheet">${head("Color and Icon")}<div class="sheet-body">
      <p class="mini" style="margin:0">How the deck looks on its public page. Your deck in Studyboard keeps its course's look.</p>
      <div class="pub-look-prev">${lookTile(d, L)}</div>${lookFields(L)}</div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" id="pubLookGo">Update Page</button></div></div>`);
    const get = wireLook(dlg, L);
    $("#pubLookGo").addEventListener("click", e => { const nd = clone(state.decks[id]); nd.pubLook = get(); saveDeck(nd, null); doPublish(id, e.currentTarget); });
  }
  function confirmPub(id, sc){
    const d = state.decks[id], c = courseOf(d.courseId), n = d.cards.filter(x => !x.draft).length, L = lookOf(d);
    openSheet(`<div class="sheet">${head("Publish " + d.name)}<div class="sheet-body">
      <p style="margin:0">Publishing gives this deck its own page in Studyboard Flashcards. Anyone can find it by searching, on Google too, and add a copy.</p>
      <ul class="pub-sum"><li><span class="mini">Shows</span><b>${esc(plural(n, "card"))}</b></li><li><span class="mini">Course</span><b>${esc(c ? courseLabel(c) : "None")}</b></li>
        <li><span class="mini">School</span><b>${esc(sc.kind === "high_school" ? `High school, ${sc.region || sc.country || ""}` : sc.name)}</b> <button type="button" class="link-btn" id="pubSch">Change</button></li><li><span class="mini">Made by</span><b>${esc(madeBy())}</b></li></ul>
      ${c ? "" : `<p class="mini" style="margin:0">Tip: put the deck in a course with a course code, so students searching that course find it.</p>`}
      <h3 class="fsec" style="margin:6px 0 0">On the Page</h3>
      <div class="pub-look-prev">${lookTile(d, L)}</div>${lookFields(L)}
      <p class="mini" style="margin:0">Your study progress is never shared. You can update or unpublish it any time.</p></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" id="pubGo">Publish</button></div></div>`);
    const get = wireLook(dlg, L);
    $("#pubSch").addEventListener("click", () => schoolSheet(() => { const s2 = (state.settings || {}).school; if (s2 && s2.v) confirmPub(id, s2); }));
    $("#pubGo").addEventListener("click", e => { const nd = clone(state.decks[id]); nd.pubLook = get(); saveDeck(nd, null); doPublish(id, e.currentTarget); });
  }
  // Shares the deck (or updates the shared copy), then publishes it
  async function doPublish(id, btn){
    const g = G(); let d = state.decks[id]; if (!d) return;
    g.busyBtn(btn, true);
    try {
      const p = g.deckPayload(d, false);
      const code = String(await rpc("share_deck", {p_deck_id: d.id, p_name: String(d.name || "Deck").slice(0, 200), p_data: p, p_count: p.cards.length}));
      await rpc("share_publish", {p_code: code, p_on: true});
      pubRefresh("deck", d.name, code, deckCourse(d));
      d = state.decks[id]; const nd = clone(d);
      nd.shared = Object.assign({}, nd.shared, {code, h: p.hash, q: 0, at: Date.now()});
      nd.published = {code, at: Date.now(), school: ((state.settings || {}).school || {}).name || ""};
      saveDeck(nd, null);
      managePub(id, true);
    } catch (e) {
      g.busyBtn(btn, false);
      if (/SB_AGE_NEEDED|SB_UNDER13/.test(String(e.message))) { try { localStorage.removeItem("studyboard:age:" + (sbUser || {}).id); } catch (er) {} if (window.SBUNAME) SBUNAME.ensureAge(() => confirmPub(id, (state.settings || {}).school)); return; }
      if (/SB_USERNAME_NEEDED/.test(String(e.message))) { try { localStorage.removeItem("studyboard:uname:" + (sbUser || {}).id); } catch (er) {} withUsername(() => confirmPub(id, (state.settings || {}).school)); return; }
      if (/SB_SCHOOL/.test(String(e.message)) || /Pick your school/.test(e.message)) { ensureSchool(sc => confirmPub(id, sc)); return; }
      if (/SB_NOT_YOURS/.test(String(e.message))) { msgSheet("Not Your Deck", "You can only publish decks you made. This one matches someone else's shared deck, so it stays in your Studyboard just for you."); return; }
      toast(String(e.message).replace(/^SB_[A-Z]+:\s*/, ""));
    }
  }
  function managePub(id, fresh){
    const d = state.decks[id]; if (!d || !d.published) return;
    const code = d.published.code, url = pubUrl("deck", d.name, code), changed = d.shared && d.shared.code === code && G().deckPayload(d, false).hash !== d.shared.h;
    openSheet(`<div class="sheet">${head(fresh ? "Published" : "Published Deck")}<div class="sheet-body">
      ${fresh ? `<p style="margin:0"><b>${esc(d.name)}</b> is live in Studyboard Flashcards. It can take a few days to show up on Google.</p>` : `<p style="margin:0">Anyone can find <b>${esc(d.name)}</b> in Studyboard Flashcards${d.published.school ? ` under ${esc(d.published.school)}` : ""}.</p>`}
      <div class="grp-link"><input type="text" readonly value="${esc(url)}" aria-label="Public page" id="pubUrl2"><button type="button" class="btn small" id="pubCopy">Copy Link</button></div>
      ${changed ? `<div class="grp-note">You've changed this deck since it was published. Update the page so it shows the latest cards.</div>` : ""}
      <div class="pub-acts"><button type="button" class="btn small" id="pubLook">Change Color and Icon</button><button type="button" class="btn small danger" id="pubOff">Unpublish</button></div></div>
      <div class="sheet-foot"><span class="spacer"></span>${changed ? `<button type="button" class="btn primary" id="pubUpd">Update Page</button>` : ""}<button type="button" class="btn${changed ? "" : " primary"}" id="pubOpen">View Page</button></div></div>`);
    $("#pubCopy").addEventListener("click", () => G().copyText(url, "Link copied"));
    $("#pubOpen").addEventListener("click", () => openOut(url));
    const up = $("#pubUpd"); if (up) up.addEventListener("click", e => doPublish(id, e.currentTarget));
    $("#pubLook").addEventListener("click", () => lookSheet(id));
    $("#pubOff").addEventListener("click", async () => {
      if (!(await askBox({title: "Unpublish?", text: "Its public page is taken down. People who added a copy keep it, and your share link keeps working.", yes: "Unpublish", danger: true}))) return;
      try { await rpc("share_publish", {p_code: code, p_on: false}); pubRefresh("deck", state.decks[id].name, code, deckCourse(state.decks[id])); const nd = clone(state.decks[id]); delete nd.published; saveDeck(nd, null); if (dlg.open) dlg.close(); toast("Unpublished"); }
      catch (e) { toast(e.message); }
    });
  }


  /* The Course Library */
  const courseKey = c => { const k = c && G() && G().codeKey(c.code || c.name); return k ? k.toUpperCase() : ""; };
  const coded = () => coursesArr().filter(c => !c.archived && courseKey(c));
  const COUNTS = {at: 0, school: "", map: null, busy: false, failed: false};
  function counts(){
    const sc = schoolOf(), keys = [...new Set(coded().map(courseKey))].slice(0, 40);
    if (!keys.length || COUNTS.busy || COUNTS.failed) return COUNTS.map;
    if (COUNTS.map && COUNTS.school === (sc ? sc.key : "") && Date.now() - COUNTS.at < 10 * 60000 && keys.every(k => k in COUNTS.map)) return COUNTS.map;
    COUNTS.busy = true;
    rpc("library_counts", {p_course_keys: keys, p_school_key: sc ? sc.key : ""}).then(r => {
      const m = {}; keys.forEach(k => { m[k] = 0; }); rows(r).forEach(x => { m[x.course_key] = Number(x.n) || 0; });
      const before = COUNTS.map || {}, shows = o => JSON.stringify(Object.keys(o).filter(k => o[k] > 0).sort().map(k => k + ":" + o[k]));
      const redo = shows(before) !== shows(m);
      Object.assign(COUNTS, {map: m, at: Date.now(), school: sc ? sc.key : ""}); if (redo) scheduleRender();
    }).catch(() => { COUNTS.failed = true; }).then(() => { COUNTS.busy = false; });
    return COUNTS.map;
  }
  function courseHtml(c){
    if (!can() || !navigator.onLine) return "";
    const k = courseKey(c); if (!k) return "";
    const m = counts(), n = m && k in m ? m[k] : null;
    if (COUNTS.failed) return "";
    return `<section class="lib-strip"><span class="lib-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="13" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v13"/></svg></span>
      <span class="lib-txt"><b>Decks From Classmates</b><span class="mini">${n == null ? `Shared decks for ${esc(c.code || k)}` : n ? `${plural(n, "deck")} shared for ${esc(c.code || k)}` : `None shared for ${esc(c.code || k)} yet. Share one of yours from its deck page.`}</span></span>
      <button type="button" class="btn small" data-act="lib-open" data-id="${esc(c.id)}">Browse</button></section>`;
  }
  const libBtn = what => { const q = what === "quizzes"; return exploreBtn(q ? "quizzes" : "flashcards") + (can() && coded().length ? `<button class="btn small" data-act="lib-open"${q ? ' data-kind="quiz"' : ""}>Course Library</button>` : ""); };
  const L = {cid: "", all: false, kind: "deck"};
  // Quizzes for a course
  async function libQuizzes(k, sk){
    const base = {p_kind: "quiz", p_q: "", p_course: k, p_limit: 60, p_offset: 0};
    let r;
    try { r = rows(await rpc("public_search", Object.assign({p_school: sk, p_sort: "", p_min: 0}, base))); }
    catch (e) { if (sk) throw e; r = rows(await rpc("public_search", base)); }
    return r.map(x => ({code: x.code, name: x.name, sharer_name: x.sharer_name, n: Number(x.n) || 0, saves: Number(x.saves) || 0, school_key: x.school_key || "", school_name: x.school_name || ""}));
  }
  async function libSheet(cid, kind){
    if (kind) L.kind = kind === "quiz" ? "quiz" : "deck";
    const isQ = L.kind === "quiz";
    const list = coded();
    if (!list.length) { msgSheet("Course Library", `Add a course code to one of your courses (like BIOL 1000) to see the ${isQ ? "quizzes" : "decks"} classmates shared for it.`); return; }
    const sc = schoolOf();
    if (!sc && !L.all) { schoolSheet(() => libSheet(cid)); return; }
    L.cid = list.some(c => c.id === cid) ? cid : list.some(c => c.id === L.cid) ? L.cid : (list.find(c => c.id === ui.filter) || list[0]).id;
    const c = courseOf(L.cid), k = courseKey(c);
    const shell = body => openSheet(`<div class="sheet lib-sheet">${head(isQ ? "Course Library: Quizzes" : "Course Library")}<div class="sheet-body">
      <div class="lib-pick"><label class="f">Course<select id="libCourse">${list.map(x => `<option value="${esc(x.id)}" ${x.id === L.cid ? "selected" : ""}>${esc(courseLabel(x))}</option>`).join("")}</select></label></div>
      <div class="lib-school mini">${sc ? `At <b>${esc(sc.name)}</b> <button type="button" class="link-btn" id="libSchool">Change</button>` : `<button type="button" class="link-btn" id="libSchool">Pick Your School</button>`}
        <label class="mi-check"><input type="checkbox" id="libAll" ${L.all || !sc ? "checked" : ""} ${sc ? "" : "disabled"}> Other schools too</label></div>
      <div id="libList" aria-live="polite">${body}</div></div>
      <div class="sheet-foot"><span class="mini">${isQ ? "Quizzes" : "Decks"} here are shared by students. Report anything that breaks the rules.</span><span class="spacer"></span><button type="button" class="btn" data-act="close">Close</button></div></div>`);
    const wire = () => {
      $("#libCourse").addEventListener("change", e => { L.cid = e.target.value; libSheet(L.cid); });
      $("#libSchool").addEventListener("click", () => schoolSheet(() => libSheet(L.cid)));
      const a = $("#libAll"); if (a) a.addEventListener("change", () => { L.all = a.checked; libSheet(L.cid); });
    };
    shell(`<p class="mini" style="margin:0">Looking…</p>`); wire();
    let r = [];
    try { r = isQ ? await libQuizzes(k, L.all || !sc ? "" : sc.key) : rows(await rpc("library_decks", {p_course_key: k, p_school_key: L.all || !sc ? "" : sc.key})); }
    catch (e) { const el = $("#libList"); if (el) el.innerHTML = `<p class="grp-note" style="margin:0">${esc(e.message)}</p>`; return; }
    const el = $("#libList"); if (!el || !dlg.open) return;
    el.innerHTML = r.length ? `<ul class="lib-list">${r.map(x => `<li><button type="button" class="lib-item" data-act="lib-preview" data-id="${esc(x.code)}"><b>${esc(x.name)}</b>
        <span class="mini">${isQ ? plural(x.n, "question") : plural(x.card_count, "card")}${x.sharer_name ? ` · by ${esc(x.sharer_name)}` : ""}${x.saves ? ` · ${plural(x.saves, "save")}` : ""}${(!sc || x.school_key !== sc.key) && x.school_name ? ` · ${esc(x.school_name)}` : ""}${x.is_mine ? " · Yours" : ""}${!isQ && copyOf(x.code) ? " · Added" : ""}</span></button></li>`).join("")}</ul>`
      : isQ ? `<div class="empty" style="margin:6px 0 0"><strong>No Quizzes Yet</strong>Nobody has published a quiz for ${esc(c.code || k)}${sc && !L.all ? ` at ${esc(sc.name)}` : ""} yet. Be the first: open one of your quizzes, tap Share, then Publish.</div>`
      : `<div class="empty" style="margin:6px 0 0"><strong>No Decks Yet</strong>Nobody has shared a deck for ${esc(c.code || k)}${sc && !L.all ? ` at ${esc(sc.name)}` : ""} yet. Be the first: open one of your decks, tap Share, then Anyone With the Link, and List It in the Course Library.</div>`;
  }

  // The listing switch in a deck's link sheet (groups' deckShareSheet)
  function libRow(d, code){ setTimeout(() => fillLibRow(d.id, code), 0); return `<div class="lib-row" id="libRow"><span class="mini">Checking the Course Library…</span></div>` + pubRow("deck", code, d.name); }

  /* Publishing to studyboardapp.com/flashcards and /quizzes */
  const siteBase = () => { try { if (/^https:$/.test(location.protocol) && !/^(localhost|127\.)/.test(location.hostname) && !inPreview()) return location.origin; } catch (e) {}
    const w = (state.settings || {}).webUrl; try { if (w) return new URL(w).origin; } catch (e) {} return "https://studyboardapp.com"; };
  // Same address rules as the pages themselves
  const pubSlug = s => String(s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70).replace(/-+$/, "") || "set";
  const pubUrl = (kind, name, code) => `${siteBase()}/${kind === "quiz" ? "quizzes" : "flashcards"}/${pubSlug(name)}-${String(code).replace(/-/g, "").toLowerCase()}`;
  const openOut = url => { try { window.open(url, "_blank", "noopener"); } catch (e) { location.href = url; } };
  // Tells the website to drop its cached copies of the page (and the lists it's on)
  function pubRefresh(kind, name, code, course){
    try { fetch(siteBase() + "/flashcards/refresh", {method: "POST", mode: "no-cors", keepalive: true, body: JSON.stringify({kind, code, name: String(name || ""), course: String(course || "")})}).catch(() => {}); } catch (e) {}
  }
  const deckCourse = d => { const c = d && courseOf(d.courseId); return c ? c.code || "" : ""; };
  function pubRow(kind, code, name){
    setTimeout(() => fillPubRow(kind, code, name), 0);
    return `<div class="lib-row" id="pubRow" data-code="${esc(code)}"><span class="mini">Checking publishing…</span></div>`;
  }
  async function fillPubRow(kind, code, name){
    const el = $("#pubRow"); if (!el || el.dataset.code !== code) return;
    let on = false;
    try { on = !!(await rpc("my_publish_state", {p_code: code})); }
    catch (e) { const r = $("#pubRow"); if (r) r.innerHTML = `<p class="mini" style="margin:0">${esc(e.message)}</p>`; return; }
    const r = $("#pubRow"); if (!r || r.dataset.code !== code) return;
    const where = kind === "quiz" ? "Studyboard Quizzes" : "Studyboard Flashcards", url = pubUrl(kind, name, code);
    const srcDeck = decksArr().find(x => x.shared && x.shared.code === code) || (kind === "quiz" ? decksArr().find(x => (x.aiQuizzes || []).some(q => q.shared && q.shared.code === code)) : null);
    if (!on && notMine(srcDeck)) { r.innerHTML = `<p class="mini" style="margin:0">${notMineText(srcDeck)}</p>`; return; }
    r.innerHTML = `<label class="mi-check"><input type="checkbox" id="pubOn" ${on ? "checked" : ""}> Publish to ${esc(where)}</label>
      <span class="mini">${on ? `Anyone can find it by searching, on the web and in ${esc(where)}. It shows your shared copy and your name.` : `Give it a public page anyone can find by searching, on Google too. It shows your shared copy and your display name.`}</span>
      ${on ? `<div class="grp-link"><input type="text" readonly value="${esc(url)}" aria-label="Public page" id="pubUrlIn"><button type="button" class="btn small" id="pubView">View Page</button></div>` : ""}`;
    const v = $("#pubView"); if (v) v.addEventListener("click", () => openOut(url));
    const ui2 = $("#pubUrlIn"); if (ui2) ui2.addEventListener("focus", () => ui2.select());
    $("#pubOn").addEventListener("change", async e => {
      const box = e.target, want = box.checked;
      const sc0 = (state.settings || {}).school;
      const missing = want && ((window.SBUNAME && (!SBUNAME.cached() || SBUNAME.ageCached() !== "ok")) || !(sc0 && sc0.v));
      if (missing) {
        box.checked = false;
        const dd = decksArr().find(x => x.shared && x.shared.code === code);
        if (kind === "deck" && dd) { dlg.close(); publishDeck(dd.id); return; }
        withUsername(() => ensureSchool(() => itemSheet(kind, decodeRef(code)))); return;
      }
      if (want && !(await askBox({title: `Publish to ${where}?`, text: `Its page is public: anyone can see the ${kind === "quiz" ? "questions and answers" : "cards"}, your username${window.SBUNAME && SBUNAME.cached() ? " (@" + SBUNAME.cached() + ")" : ""} and your school (${((state.settings || {}).school || {}).name || ""}), and search engines can list it. You can unpublish any time.`, yes: "Publish"}))) { box.checked = false; return; }
      box.disabled = true;
      try {
        if (want) await keepSchool((state.settings || {}).school, false);
        await rpc("share_publish", {p_code: code, p_on: want});
        const dd = kind === "deck" && decksArr().find(x => x.shared && x.shared.code === code);
        if (dd) { const nd = clone(dd); if (want) nd.published = {code, at: Date.now(), school: ((state.settings || {}).school || {}).name || ""}; else delete nd.published; saveDeck(nd, null); }
        pubRefresh(kind, name, code, dd ? deckCourse(dd) : "");
        toast(want ? `Published. It can take a few days to show up on Google.` : "Unpublished. Its public page is gone."); fillPubRow(kind, code, name);
      }
      catch (err) { box.checked = !want; box.disabled = false; if (/SB_SCHOOL/.test(String(err.message))) ensureSchool(() => {}); else toast(String(err.message).replace(/^SB_[A-Z]+:\s*/, "")); }
    });
  }
  const EXPLORE_IC = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>';
  const exploreBtn = what => inPreview() ? "" : `<button class="btn small" data-act="pub-explore" data-id="${what === "quizzes" ? "quizzes" : "flashcards"}" aria-label="Explore public ${what === "quizzes" ? "quizzes" : "flashcards"}">${EXPLORE_IC}<span>Explore</span></button>`;
  async function fillLibRow(deckId, code){
    const el = $("#libRow"), d = state.decks[deckId]; if (!el || !d) return;
    const c = courseOf(d.courseId), k = courseKey(c), sc = schoolOf();
    if (!k) { el.innerHTML = `<p class="mini" style="margin:0">Put this deck in a course with a course code to list it in that course's library for classmates.</p>`; return; }
    let listed = false;
    try {
      const g = G(), q = await g.cli().from("shared_decks").select("listed").eq("code", code).maybeSingle();
      if (q.error) throw shErr(q.error);
      listed = !!(q.data && q.data.listed);
    } catch (e) { if ($("#libRow")) $("#libRow").innerHTML = `<p class="mini" style="margin:0">${esc(e.message)}</p>`; return; }
    if (!$("#libRow")) return;
    $("#libRow").innerHTML = `<label class="mi-check"><input type="checkbox" id="libOn" ${listed ? "checked" : ""}> List It in the ${esc(c.code || k)} Course Library</label>
      <span class="mini">${sc ? `Classmates at ${esc(sc.name)} who have ${esc(c.code || k)} can find it and add a copy. <button type="button" class="link-btn" id="libSch">Change School</button>` : `Pick your school first so classmates can find it. <button type="button" class="link-btn" id="libSch">Pick Your School</button>`}</span>`;
    $("#libSch").addEventListener("click", () => schoolSheet(() => { const dd = state.decks[deckId]; if (dd) G().deckShareSheet(dd); }));
    $("#libOn").addEventListener("change", async e => {
      const box = e.target, on = box.checked, s2 = schoolOf();
      if (on && !s2) { box.checked = false; schoolSheet(() => { const dd = state.decks[deckId]; if (dd) G().deckShareSheet(dd); }); return; }
      box.disabled = true;
      try {
        await rpc("library_list", {p_code: code, p_listed: on, p_course_key: k, p_course_label: courseLabel(c), p_school_key: s2 ? s2.key : "", p_school_name: s2 ? s2.name : ""});
        COUNTS.at = 0; toast(on ? `Listed in the ${c.code || k} Course Library` : "Taken out of the Course Library");
      } catch (err) { box.checked = !on; toast(err.message); }
      box.disabled = false;
    });
  }

  /* Actions */
  hook("act", (act, el, id) => {
    switch (act) {
      case "share-link": shareRef(el.dataset.kind, el.dataset.ref); return true;
      case "share-report": reportSheet(id); return true;
      case "lib-open": libSheet(id || (ui.tab === "courses" ? ui.courseId : ""), el.dataset.kind || "deck"); return true;
      case "lib-preview": open(id); return true;
      case "pub-deck": publishDeck(id); return true;
      case "pub-explore": openOut(siteBase() + "/" + (id === "quizzes" ? "quizzes" : "flashcards")); return true;
    }
    return false;
  });

  const css = document.createElement("style");
  css.textContent = `
.sh-card{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;width:100%;min-height:170px;padding:22px 18px;border-radius:12px;border:1px solid var(--line);background:var(--surface);color:var(--ink);box-shadow:0 2px 10px rgba(20,30,50,.08);font:inherit;cursor:pointer;text-align:center}
.sh-card.is-back{background:var(--soft)}
.sh-card:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.sh-side{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.sh-txt{font-size:18px;font-weight:600;line-height:1.35;white-space:pre-wrap;overflow-wrap:anywhere;max-height:40vh;overflow:auto}
.sh-tap{opacity:.8}
.sh-nav{display:flex;align-items:center;justify-content:space-between;gap:10px}
.sh-q{display:flex;flex-direction:column;gap:4px;padding:12px 14px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}
.sh-note{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5;padding:14px 16px;border:1px solid var(--line);border-radius:10px;background:var(--surface);max-height:50vh;overflow:auto}
.sh-reasons{border:0;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.lib-strip{display:flex;align-items:center;gap:12px;margin:14px 0;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.lib-ic{display:flex;color:var(--c, var(--accent))}
.lib-txt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.lib-school{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px}
.lib-school .mi-check{margin-left:auto}
.lib-list{list-style:none;margin:4px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}
.lib-item{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;padding:11px 14px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font:inherit;text-align:left;cursor:pointer}
.lib-item:hover{border-color:var(--accent)}
.lib-item b{overflow-wrap:anywhere}
.lib-row{display:flex;flex-direction:column;gap:4px;padding:10px 0 0;border-top:1px solid var(--line)}
.sch-kind{display:flex;gap:6px}
.sch-kind button{flex:1}
.sch-list{display:flex;flex-direction:column;gap:6px;max-height:44vh;overflow:auto}
.sch-item{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;min-height:44px;padding:9px 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font:inherit;text-align:left;cursor:pointer}
.sch-item:hover,.sch-item:focus-visible{border-color:var(--accent)}
.sch-auto{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border:1px solid var(--accent);border-radius:12px;background:var(--surface)}
.sch-auto>span{display:flex;flex-direction:column;gap:2px;min-width:0}
/* Explore and Publish: the globe and the word share one centre line, with a gap between them */
.btn[data-act="pub-explore"],.btn[data-act="pub-deck"]{display:inline-flex;align-items:center;justify-content:center;gap:7px}
.btn[data-act="pub-explore"] > svg,.btn[data-act="pub-deck"] > svg{flex:none;display:block;position:relative;top:-.8px}
.pub-acts{display:flex;flex-wrap:wrap;gap:8px}
.pub-look-prev{padding:14px 14px 14px 2px;max-width:340px}
.pub-look-tile.deck.deck-fc > .deck-face{height:auto;min-height:0}
.pub-look-tile .deck-main{padding:10px 16px 18px!important}
.pub-look-fs{border:0;margin:0;padding:0;min-width:0}
.pub-look-fs legend{font:700 .9rem var(--display);margin-bottom:8px;padding:0}
.pub-look-fs .swatches span{width:28px;height:28px}
.pub-look-ic{grid-template-columns:repeat(auto-fill,minmax(40px,1fr))!important;max-height:188px;overflow:auto;padding:4px}
.grp-prev .deck-tab{display:inline-flex;align-items:center;gap:5px}
.gp-ic{display:inline-grid;width:13px;height:13px}
.gp-ic svg{width:100%;height:100%;display:block;stroke:#fff!important;filter:none!important;transform:none!important}
.gp-ic svg .a,.gp-ic svg .b,.gp-ic svg .y,.gp-ic svg .g,.gp-ic svg .r{fill:rgba(255,255,255,.35)}
.gp-ic svg .sa,.gp-ic svg .sb{stroke:#fff}
.pub-sum{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.pub-sum li{display:flex;flex-direction:column;gap:2px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);min-width:0;overflow-wrap:anywhere}
@media (max-width:600px){.lib-school .mi-check{margin-left:0}.sh-txt{font-size:16px}}
`;
  document.head.appendChild(css);

  window.SBSHARE = {can, open, shareRef, libRow, libBtn, exploreBtn, pubRow, pubUrl, courseHtml, libSheet, schoolOf, hostKey, schoolSheet, publishDeck, T: {rpc, COUNTS}};
})();

