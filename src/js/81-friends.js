/* ===== module: 81-friends.js ===== */
/* Friends (FRIENDS-PLAN.md, step 1; server: supabase-friends.sql)
   Two people are friends once one asks and the other accepts. You ask by typing someone's exact @username or by opening
   their friend link (or its QR code). There's no search or browsing, contacts are never read, and asking by username
   always gives the same answer, so nobody can find out which usernames exist. Blocking someone ends the friendship.
   Friends see each other's display name and @username, nothing else. */
(() => {
  /*FRIENDS-START*/
  const FRIENDS = (() => {
    const CODE = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    // A friend link's code from a link, or a code typed with or without the dash ("" when there isn't one)
    function codeOf(s){
      s = String(s || "").trim();
      const m = s.match(/[?&]friend=([A-Za-z0-9-]+)/), raw = m ? m[1] : /^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/.test(s) ? s : "";
      const x = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
      return x.length === 8 ? x.slice(0, 4) + "-" + x.slice(4) : "";
    }
    // What the Add box holds: a friend link or code, a username, or neither (usernames never have a dash, codes always do)
    function parseAdd(s){
      const v = String(s || "").trim();
      if (!v) return {kind: "bad", msg: "Type a friend's @username or their friend code."};
      const code = codeOf(v);
      if (code) return {kind: "code", code};
      if (/[?&/]/.test(v)) return {kind: "bad", msg: "That isn't a friend code. Ask them for the code in their Friends, like ABCD-1234."};
      const name = v.replace(/^@/, "");
      if (!/^[A-Za-z][A-Za-z0-9_.]{2,19}$/.test(name)) return {kind: "bad", msg: "Type their whole username, like @sam.lee."};
      return {kind: "name", name};
    }
    // The server's answer to a request, in words. 'sent' is the same for a username that doesn't exist (on purpose)
    function answerText(r, who){
      const w = who ? (who.startsWith("@") ? who : "@" + who) : "them";
      if (r === "accepted") return `You and ${w} are now friends.`;
      if (r === "already") return `You and ${w} are already friends.`;
      return who && who.startsWith("@") ? `Request sent. If ${w} is on Studyboard, they'll see it in their Friends.` : `Request sent to ${w}.`;
    }
    // Rows from my_friends() in three lists
    function split(rows){
      const out = {incoming: [], friends: [], sent: []};
      for (const r of Array.isArray(rows) ? rows : []) {
        if (!r || typeof r.user_id !== "string") continue;
        if (r.status === "accepted") out.friends.push(r); else if (r.mine) out.sent.push(r); else out.incoming.push(r);
      }
      const by = (a, b) => String(a.display_name || "").localeCompare(String(b.display_name || ""), undefined, {sensitivity: "base"});
      out.friends.sort(by); out.sent.sort(by);
      out.incoming.sort((a, b) => String(b.since || "").localeCompare(String(a.since || "")));
      return out;
    }
    // "today", "yesterday", "3 days ago"
    function ago(iso, now){
      const t = Date.parse(iso || ""); if (!Number.isFinite(t)) return "";
      const d = Math.floor(((now || Date.now()) - t) / 864e5);
      return d <= 0 ? "today" : d === 1 ? "yesterday" : d < 30 ? d + " days ago" : d < 60 ? "a month ago" : Math.floor(d / 30) + " months ago";
    }
    // The friend-link card on Groups: signed in, no friends or requests yet, not dismissed
    const showCard = s => !!s && s.live && s.loaded && !s.hidden && s.friends === 0 && s.incoming === 0 && s.sent === 0;
    return {codeOf, parseAdd, answerText, split, ago, showCard, CODE};
  })();
  /*FRIENDS-END*/

  /* Connection: the same Supabase client as Study Groups (tests use window.__sbGroupsStub) */
  const stub = () => window.__sbGroupsStub || null;
  const cli = () => { const s = stub(); return s ? s.client : (sbActive() ? sb : null); };
  const me = () => { const s = stub(); return s ? s.user : sbUser; };
  const live = () => !inPreview() && !!cli() && !!me() && !me().is_anonymous;
  const SETUP = () => srvSetup("Friends", "supabase-friends.sql");
  function fErr(e){
    const m = String((e && (e.message || e.details)) || e || ""), code = String((e && e.code) || "");
    if (/fetch|network|Load failed|timed? ?out/i.test(m)) return new Error("Couldn't reach Studyboard. Check your internet connection and try again.");
    if (["42883", "PGRST202", "42P01", "PGRST205"].includes(code) || /Could not find the function|schema cache|does not exist/i.test(m)) return Object.assign(new Error(SETUP()), {setup: true});
    if (/Sign in first|JWT|not authenticated/i.test(m)) return new Error("Sign in to Studyboard first, then try again.");
    return new Error(m.replace(/^SB_[A-Z0-9_]+:\s*/, "").slice(0, 200) || "Something went wrong. Try again.");
  }
  async function rpc(fn, args){
    const c = cli(); if (!c) throw new Error("Sign in to Studyboard first, then try again.");
    let r; try { r = await c.rpc(fn, args || {}); } catch (e) { throw fErr(e); }
    if (r && r.error) throw fErr(r.error);
    return r ? r.data : null;
  }
  const api = {
    list: () => rpc("my_friends"),
    ask: name => rpc("request_friend", {p_username: name}),
    askCode: code => rpc("request_friend_by_code", {p_code: code}),
    preview: async code => { const d = await rpc("friend_link_preview", {p_code: code}); return (Array.isArray(d) ? d[0] : d) || null; },
    answer: (id, yes) => rpc("answer_friend", {p_user: id, p_accept: !!yes}),
    remove: id => rpc("remove_friend", {p_user: id}),
    code: fresh => rpc("my_friend_code", {p_new: !!fresh}),
    block: async id => { const c = cli(); const r = await c.from("group_blocks").insert({blocked_id: id}); if (r && r.error && r.error.code !== "23505") throw fErr(r.error); }
  };

  /* State */
  const S = {rows: null, lists: FRIENDS.split([]), at: 0, loading: null, err: "", setup: false, code: "", qr: false, msg: "", msgBad: false, uid: ""};
  const HIDE = () => "studyboard:friendCard:" + ((me() || {}).id || "");
  const PEND = "studyboard:friendLink";
  const cardHidden = () => { try { return !!localStorage.getItem(HIDE()); } catch (e) { return false; } };
  const ready = () => (window.SBUNAME && SBUNAME.ageReady) ? SBUNAME.ageReady() : Promise.resolve(true);
  function reset(){ Object.assign(S, {rows: null, lists: FRIENDS.split([]), at: 0, loading: null, err: "", setup: false, code: "", qr: false, msg: "", msgBad: false}); }
  // Load the list (at most once a minute unless forced)
  function load(force){
    if (!live()) return Promise.resolve(null);
    const id = me().id; if (S.uid !== id) { reset(); S.uid = id; }
    if (S.loading) return S.loading;
    if (!force && S.rows && Date.now() - S.at < 60e3) return Promise.resolve(S.rows);
    S.loading = (async () => {
      try {
        if (!(await ready())) return null;
        const rows = await api.list();
        if (S.uid !== id) return null;
        S.rows = Array.isArray(rows) ? rows : []; S.lists = FRIENDS.split(S.rows); S.err = ""; S.setup = false; S.at = Date.now();
      } catch (e) { S.err = e.message; S.setup = !!e.setup; S.at = Date.now(); if (!S.rows) S.rows = []; }
      finally { S.loading = null; }
      drawSheet(); refreshPage();
      return S.rows;
    })();
    return S.loading;
  }
  // The Friends button and card on Groups are swapped in place: a full render would cut short whatever the page is
  // doing (a card being pressed and held to reorder, a menu that's open)
  // Only what's already on the page is updated (the page header may have been rearranged by the page layout, so they're
  // found by class). The card is never added here: added late, it would push the groups down under a finger.
  function refreshPage(){
    const swap = (old, html) => {
      if (!old) return;
      const t = document.createElement("template"); t.innerHTML = String(html || "").trim();
      const el = t.content.firstElementChild;
      if (el) old.replaceWith(el); else old.remove();
    };
    swap(document.querySelector(".frd-head-btn"), groupsHead());
    swap(document.querySelector(".frd-card"), groupsTop());
  }

  /* Drawing */
  const ICON_FRIENDS = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 19.5c0-3.2 2.7-5.5 6-5.5s6 2.3 6 5.5"/><path d="M16 11.5h6M19 8.5v6"/></svg>';
  const avatar = r => {
    const G = window.SBGROUPS && SBGROUPS.share;
    if (G && G.avatar) { try { return G.avatar("", r.user_id, r.display_name, r.face || ""); } catch (e) {} }
    const w = String(r.display_name || "?").trim().split(/\s+/).filter(Boolean);
    return `<span class="grp-av" aria-hidden="true">${esc(((w[0] || "?")[0] + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase())}</span>`;
  };
  const whoLine = r => `<b>${esc(r.display_name || "Classmate")}</b>${r.username ? `<span class="mini">@${esc(r.username)}</span>` : ""}`;
  const row = (r, extra, btns) => `<li class="grp-item frd-row" data-fr="${esc(r.user_id)}">${avatar(r)}<div class="grp-item-main">${whoLine(r)}${extra ? `<span class="mini">${extra}</span>` : ""}</div><div class="grp-item-btns">${btns}</div></li>`;
  const sec = (title, n, body) => `<section class="frd-sec"><h3 class="fsec">${esc(title)}<span class="n">${n}</span></h3><ul class="grp-list">${body}</ul></section>`;
  function linkOf(code){
    const G = window.SBGROUPS && SBGROUPS.share;
    return code && G && G.linkFor ? G.linkFor("friend", code) : "";
  }
  function bodyHtml(){
    if (S.setup) return `<p class="frd-msg bad" role="alert">${esc(S.err)}</p>`;
    const L = S.lists, link = linkOf(S.code);
    const incoming = L.incoming.map(r => row(r, esc(r.via === "link" ? "Used your friend code · " + FRIENDS.ago(r.since) : "Asked " + FRIENDS.ago(r.since)),
      `<button type="button" class="btn small primary" data-act="frd-accept" data-id="${esc(r.user_id)}">Accept</button><button type="button" class="btn small" data-act="frd-decline" data-id="${esc(r.user_id)}">Decline</button>`)).join("");
    const friends = L.friends.map(r => row(r, "", `<details class="grp-more g2-mm frd-more"><summary class="g2-dots" aria-label="More for ${esc(r.display_name || "this friend")}">⋯</summary><div class="grp-menu">
      <button type="button" class="btn" data-act="frd-remove" data-id="${esc(r.user_id)}">Remove Friend</button><button type="button" class="btn" data-act="frd-block" data-id="${esc(r.user_id)}">Block</button></div></details>`)).join("");
    const sent = L.sent.map(r => row(r, esc("Waiting · asked " + FRIENDS.ago(r.since)), `<button type="button" class="btn small" data-act="frd-cancel" data-id="${esc(r.user_id)}">Cancel</button>`)).join("");
    return `${S.err ? `<p class="frd-msg bad" role="alert">${esc(S.err)}</p>` : ""}
      <section class="frd-link" aria-labelledby="frdLinkT"><h3 class="fsec" id="frdLinkT">Your Friend Code</h3>
        <p class="mini">Give it to someone you study with. They type it in Add a Friend, then you choose whether to accept.</p>
        ${S.code ? `<div class="frd-link-row"><code class="frd-code frd-code-big" aria-label="Your friend code: ${esc(S.code.split("").join(" "))}">${esc(S.code)}</code></div>
        <div class="row-actions"><button type="button" class="btn small primary" data-act="frd-copy">Copy Code</button>${link && (navigator.share || (window.SBGROUPS && SBGROUPS.share && SBGROUPS.share.sendText)) ? `<button type="button" class="btn small" data-act="frd-share">Share</button>` : ""}<button type="button" class="btn small" data-act="frd-qr" aria-expanded="${S.qr}">${S.qr ? "Hide QR Code" : "Show QR Code"}</button><button type="button" class="link-btn" data-act="frd-newlink">Make a New Code</button></div>
        ${S.qr && link && typeof QR !== "undefined" ? `<div class="frd-qr">${QR.svg(link, "QR code with your friend code")}<p class="mini">Scan it with a phone camera.</p></div>` : ""}`
        : `<p class="mini"><span class="ai-spin" aria-hidden="true"></span> Getting your code…</p>`}</section>
      ${L.incoming.length ? sec("Requests", L.incoming.length, incoming) : ""}
      ${sec("Friends", L.friends.length, friends || `<li class="frd-empty mini">${S.rows == null ? "Loading…" : "No friends yet. Add someone by their @username or friend code, or give them yours."}</li>`)}
      ${L.sent.length ? sec("Sent", L.sent.length, sent) : ""}
      <p class="hint-line">Friends see your display name and @username. Nobody can search for you: they need your exact username or your link.</p>`;
  }
  const sheetOpen = () => dlg.open && !!dlg.querySelector("#frdSheet");
  function drawSheet(){
    if (!sheetOpen()) return;
    const b = $("#frdBody"); if (!b) return;
    b.innerHTML = bodyHtml();
    const m = $("#frdMsg"); if (m) { m.textContent = S.msg; m.className = "frd-msg" + (S.msgBad ? " bad" : S.msg ? " good" : ""); }
  }
  function say(msg, bad){ S.msg = msg || ""; S.msgBad = !!bad; const m = $("#frdMsg"); if (m) { m.textContent = S.msg; m.className = "frd-msg" + (bad ? " bad" : msg ? " good" : ""); } }

  function openFriends(prefill){
    if (!live()) { toast(inPreview() ? "Friends work on the Studyboard website and in the app." : "Sign in to your free Studyboard account to add friends."); return; }
    S.msg = ""; S.msgBad = false;
    openSheet(`<form class="sheet frd-sheet" id="frdSheet">${head("Friends")}<div class="sheet-body">
      <label class="f"><span class="lh">Add a Friend</span><span class="frd-add"><input type="text" name="who" id="frdWho" maxlength="300" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="@username or friend code" value="${esc(prefill || "")}" data-noenter><button type="submit" class="btn primary" data-submit id="frdGo">Add</button></span></label>
      <p class="frd-msg" id="frdMsg" role="status" aria-live="polite"></p>
      <div id="frdBody">${bodyHtml()}</div></div></form>`, fd => { add(String(fd.get("who") || "")); return false; });
    load(true);
    if (!S.code) ensureCode();
  }
  async function ensureCode(fresh){
    try { if (!(await ready())) return; S.code = String(await api.code(fresh) || ""); drawSheet(); if (fresh) toast("Your old friend code no longer works."); }
    catch (e) { if (e.setup) { S.setup = true; S.err = e.message; } else say(e.message, true); drawSheet(); }
  }
  async function add(raw){
    const p = FRIENDS.parseAdd(raw);
    if (p.kind === "bad") { say(p.msg, true); return; }
    const go = $("#frdGo"); if (go) go.disabled = true;
    say("Sending…");
    try {
      if (!(await ready())) return;
      if (p.kind === "code") { openLink(p.code); return; }
      const r = await api.ask(p.name);
      say(FRIENDS.answerText(r, "@" + p.name));
      const i = $("#frdWho"); if (i) i.value = "";
      load(true);
    } catch (e) { say(e.message, true); }
    finally { const g = $("#frdGo"); if (g) g.disabled = false; }
  }

  /* A friend link: who it belongs to, then ask */
  async function openLink(code){
    if (!live()) return;
    if (!(await ready())) return;
    openSheet(`<div class="sheet" id="frdLinkSheet">${head("Add a Friend")}<div class="sheet-body"><p class="status-msg"><span class="ai-spin" aria-hidden="true"></span> Looking up the link…</p></div></div>`);
    let pv = null, err = "";
    try { pv = await api.preview(code); } catch (e) { err = e.message; }
    if (!dlg.open || !dlg.querySelector("#frdLinkSheet")) return;
    if (!pv) {
      openSheet(`<div class="sheet" id="frdLinkSheet">${head("Add a Friend")}<div class="sheet-body"><p style="margin:0" role="alert">${esc(err || "That friend code isn't working anymore. Ask them for their current code.")}</p></div>
        <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-act="close">OK</button></div></div>`);
      return;
    }
    const name = esc(pv.display_name || "Classmate"), un = pv.username ? `<span class="mini">@${esc(pv.username)}</span>` : "";
    const say2 = {self: "This is your own friend code. Give it to someone you study with.", friends: `You and ${name} are already friends.`,
      asked: `You've asked ${name} to be friends. They'll see it in their Friends.`, asked_you: `${name} asked to be your friend.`}[pv.state];
    const can = pv.state === "none" || pv.state === "asked_you";
    openSheet(`<div class="sheet" id="frdLinkSheet">${head("Add a Friend")}<div class="sheet-body">
      <div class="frd-who">${avatar({user_id: "link-" + code, display_name: pv.display_name})}<div class="grp-item-main"><b>${name}</b>${un}</div></div>
      <p style="margin:0">${say2 || `Ask ${name} to be your friend? They choose whether to accept.`}</p>
      <p class="mini" style="margin:0">Friends see each other's display name and @username.</p></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">${can ? "Not Now" : "OK"}</button>${can ? `<button type="button" class="btn primary" data-act="frd-link-ask" data-id="${esc(code)}">${pv.state === "asked_you" ? "Accept" : "Ask to Be Friends"}</button>` : ""}</div></div>`);
  }
  // A ?friend= link opened the app: kept until you're signed in (for a week)
  function takeLink(){ try { const p = JSON.parse(localStorage.getItem(PEND) || "null"); if (p && FRIENDS.CODE.test(p.code) && Date.now() - p.at < 7 * 864e5) return p; localStorage.removeItem(PEND); } catch (e) {} return null; }
  let linkBusy = false, toldSignIn = false;
  function checkLink(){
    const p = takeLink(); if (!p || linkBusy) return;
    if (!live()) {
      if (!toldSignIn && !inPreview() && sbConfig()) { toldSignIn = true; setTimeout(() => toast("Sign in or make a free account, then the friend link opens."), 1500); }
      return;
    }
    if (dlg.open) return;   // waits for whatever is showing (the welcome, the birthday question)
    linkBusy = true;
    try { localStorage.removeItem(PEND); } catch (e) {}
    openLink(p.code).finally(() => { linkBusy = false; });
  }

  /* Actions */
  hook("act", (act, el) => {
    if (!/^frd-/.test(act)) return false;
    const id = el && el.dataset ? el.dataset.id || "" : "", r = (S.rows || []).find(x => x.user_id === id), nm = r ? r.display_name || "this person" : "this person";
    const busy = fn => { if (el) el.disabled = true; return Promise.resolve().then(fn).catch(e => { say(e.message, true); toast(e.message); }).finally(() => { if (el && el.isConnected) el.disabled = false; }); };
    switch (act) {
      case "frd-open": if (dlg.open) dlg.close(); setTimeout(() => openFriends(), 0); return true;
      case "frd-accept": busy(async () => { const ok = await api.answer(id, true); say(ok ? `You and ${nm} are now friends.` : "That request isn't there anymore."); await load(true); }); return true;
      case "frd-decline": busy(async () => { await api.answer(id, false); say(`Declined. ${nm} isn't told.`); await load(true); }); return true;
      case "frd-cancel": busy(async () => { await api.remove(id); say("Request cancelled."); await load(true); }); return true;
      case "frd-remove":
        confirmSheet("Remove Friend?", `${nm} won't be your friend anymore and isn't told. You can ask again later.`, "Remove", () => {
          api.remove(id).then(() => { toast(`Removed ${nm}.`); S.at = 0; setTimeout(() => openFriends(), 60); }, e => toast(e.message));
        });
        return true;
      case "frd-block":
        confirmSheet(`Block ${nm}?`, `This removes ${nm} as a friend, and neither of you can send the other a friend request. In study groups you share, you won't see what they post. You can unblock them from a group's member list.`, "Block", () => {
          api.block(id).then(() => { toast(`Blocked ${nm}.`); S.at = 0; setTimeout(() => openFriends(), 60); }, e => toast(e.message));
        });
        return true;
      // the code itself, to paste or read out; Share sends it in a message (with a link that opens it, for whoever's on a phone)
      case "frd-copy": {
        const G = window.SBGROUPS && SBGROUPS.share;
        if (G && G.copyText) G.copyText(S.code, "Code copied. They type it in Friends, Add a Friend."); else navigator.clipboard.writeText(S.code).then(() => toast("Code copied"), () => {});
        return true;
      }
      case "frd-share": {
        const link = linkOf(S.code), G = window.SBGROUPS && SBGROUPS.share, txt = `Add me as a friend on Studyboard. My friend code is ${S.code}`;
        if (G && G.sendText) G.sendText("Studyboard Friend Code", txt, link); else navigator.clipboard.writeText(`${txt}`).then(() => toast("Copied"), () => {});
        return true;
      }
      case "frd-qr": S.qr = !S.qr; drawSheet(); return true;
      case "frd-newlink":
        confirmSheet("Make a New Code?", "Your current friend code and QR code stop working. Friends you already have stay your friends.", "Make a New Code", () => { setTimeout(() => { openFriends(); ensureCode(true); }, 60); });
        return true;
      case "frd-link-ask": busy(async () => {
        const r = await api.askCode(id);
        if (dlg.open) dlg.close();
        toast(FRIENDS.answerText(r, ""));
        load(true);
      }); return true;
      case "frd-card-hide": try { localStorage.setItem(HIDE(), String(Date.now())); } catch (e) {} refreshPage(); return true;
    }
    return false;
  });

  /* Where Friends shows: Groups (a button in the header and, the first time, a card) and Settings > Account */
  function groupsHead(){
    if (!live()) return "";
    const n = S.lists.incoming.length;
    return `<button type="button" class="btn small frd-head-btn" data-act="frd-open">${ICON_FRIENDS}<span>Friends</span>${n ? `<span class="frd-badge" aria-label="${n} friend request${n === 1 ? "" : "s"}">${n}</span>` : ""}</button>`;
  }
  function groupsTop(){
    if (!live()) return "";
    const L = S.lists;
    if (!FRIENDS.showCard({live: true, loaded: S.rows != null && !S.err, hidden: cardHidden(), friends: L.friends.length, incoming: L.incoming.length, sent: L.sent.length})) return "";
    return `<section class="frd-card" aria-labelledby="frdCardT"><div><b id="frdCardT">Studying With Someone?</b><span>Give them your friend code. Once you're friends, you'll find each other here.</span></div>
      <div class="row-actions"><button type="button" class="btn primary small" data-act="frd-open">Add a Friend</button><button type="button" class="link-btn" data-act="frd-card-hide">Not Now</button></div></section>`;
  }
  hook("groupsHead", groupsHead);
  hook("groupsTop", groupsTop);
  hook("menu", () => live() ? `<button data-act="frd-open" data-group="account"><span>Friends<span class="sub">${S.rows ? esc([S.lists.friends.length === 1 ? "1 friend" : S.lists.friends.length + " friends", S.lists.incoming.length ? S.lists.incoming.length + " waiting for you" : ""].filter(Boolean).join(" · ")) : "Add friends by @username or a link"}</span></span></button>` : "");
  hook("render", tab => {
    const u = me() && me().id;
    if (u !== S.uid && !u) reset();
    if (live() && tab === "groups") load(false);
    checkLink();
  });
  hook("boot", () => {
    try {
      const u = new URL(location.href), f = u.searchParams.get("friend");
      if (f) {
        const code = FRIENDS.codeOf("?friend=" + f);
        if (code) localStorage.setItem(PEND, JSON.stringify({code, at: Date.now()}));
        u.searchParams.delete("friend");
        history.replaceState(history.state, "", u.pathname + u.search + u.hash);
      }
    } catch (e) {}
    setTimeout(checkLink, 1200);
  });
  // A link waiting for sign-in, or for another sheet to close
  setInterval(() => { if (takeLink()) checkLink(); }, 3000);

  window.SBFRIENDS = {open: openFriends, load, T: {FRIENDS}};
})();
