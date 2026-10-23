/* ===== module: 97b-emails.js ===== */
/* Emails (Courses, between Grades and Files): your school's messages, read and answered from Studyboard with your school sign-in.
   Works in the desktop app with Canvas (its Inbox is reachable with your sign-in). Brightspace and Blackboard don't offer a
   mail API to apps, so they can't be read here. Nothing is sent without a tap on Send. */
(() => {
  const E = ui.em = ui.em || {list: null, loading: false, err: "", open: null, thread: null, tLoading: false, draft: "", ask: "", sending: false, drafting: false};
  const canvas = () => { try { const L = window.SBLMS && SBLMS.canvas; const c = L && L.cfg(); return L && c && c.mode === "api" && c.host ? c : null; } catch (e) { return null; } };
  const hasDesk = () => !!(lmsBridge() && lmsBridge().mail);
  // Two ways in: the desktop app, with your school sign-in (read and reply), and the Studyboard School Sync extension on the website
  // (the latest messages, read only). Canvas access tokens are no longer used: Canvas's API policy says an app used by many people must
  // not ask them to make a token and paste it in (it must use OAuth with a key from the school). A token an older version saved is
  // erased from this device here, once.
  const TK = "studyboard:cvmail", CV_SECRET = "canvas-mail";
  (async () => { try { localStorage.removeItem(TK); } catch (e) {} try { if (await DEVSECRET.get(CV_SECRET)) await DEVSECRET.remove(CV_SECRET); } catch (e) {} })();
  // The Studyboard School Sync extension (website) also reads the Canvas Inbox: the latest conversations, kept on this device only (never synced), read-only
  const GK = "studyboard:grabmail";
  const grabbed = () => { try { const g = JSON.parse(localStorage.getItem(GK) || "null"); return g && /^https:\/\/[^/?#@\s]+$/.test(String(g.host || "")) && Array.isArray(g.items) ? g : null; } catch (e) { return null; } };
  window.addEventListener("sb:grab-mail", e => { const d = e.detail || {}; try { localStorage.setItem(GK, JSON.stringify({host: d.host, at: Date.now(), items: (d.items || []).slice(0, 30)})); } catch (x) {} E.list = null; E.open = null; E.thread = null; E.err = ""; if (ui.tab === "emails") render(); });
  window.addEventListener("sb:secrets-wiped", () => { E.list = null; E.open = null; E.thread = null; try { localStorage.removeItem(GK); } catch (e) {} });
  const via = () => (canvas() && hasDesk() ? {kind: "desk", host: canvas().host} : grabbed() ? {kind: "grab", host: grabbed().host} : null);
  function grabCall(q){
    const g = grabbed(); if (!g) return {error: "none"};
    const last = c => (c.msgs || [])[(c.msgs || []).length - 1] || {};
    if (q.op === "list") return {ok: true, items: g.items.map(c => ({id: String(c.id), subject: cleanT(c.subject, 160) || "(No subject)", preview: cleanT(last(c).body, 200), at: c.at || last(c).at || "", count: (c.msgs || []).length, unread: !!c.unread, course: cleanT(c.course, 80), names: (c.names || []).slice(0, 4).map(x => cleanT(x, 60))}))};
    if (q.op === "get") { const c = g.items.find(x => String(x.id) === String(q.id)); if (!c) return {error: "gone"};
      return {ok: true, subject: cleanT(c.subject, 160) || "(No subject)", course: cleanT(c.course, 80), names: (c.names || []).map(x => cleanT(x, 60)).filter(Boolean).slice(0, 8), messages: (c.msgs || []).map((m, i) => ({id: String(i), from: cleanT(m.from, 60) || "Someone", mine: !!m.mine, at: m.at || "", body: cleanT(m.body, 6000), files: Number(m.files) || 0}))}; }
    return {error: "grab"};
  }
  const cleanT = (x, n) => String(x == null ? "" : x).replace(/\r/g, "").trim().slice(0, n);
  const mailCall = spec => { const v = via(); if (!v) return Promise.resolve({error: "none"}); if (v.kind === "grab") return Promise.resolve(grabCall(spec)); return lmsBridge().mail("canvas", v.host, spec); };
  const when = iso => { const d = new Date(iso); if (isNaN(d)) return ""; const days = Math.floor((Date.now() - d.getTime()) / 864e5); return days <= 0 ? d.toLocaleTimeString(undefined, {hour: "numeric", minute: "2-digit"}) : days < 7 ? d.toLocaleDateString(undefined, {weekday: "short"}) : d.toLocaleDateString(undefined, {month: "short", day: "numeric"}); };
  const whenLong = iso => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString(undefined, {month: "short", day: "numeric", hour: "numeric", minute: "2-digit"}); };
  const errText = r => !r ? "Couldn't reach your school site." : r.error === "network" ? "Your school's Canvas didn't answer. It may not allow access from here, or you may be offline." : r.needLogin ? "Your school sign-in has expired. Sign in again under Settings, School Sites." : r.error === "unsupported" ? "This school site can't be read for messages." : "Something went wrong (" + String(r.error || "unknown").slice(0, 60) + "). Try again.";
  async function load(){
    if (!via()) return;
    E.loading = true; E.err = ""; if (ui.tab === "emails") render();
    try { const r = await mailCall({op: "list"}); if (r && r.ok) E.list = r.items; else E.err = errText(r); } catch (e) { E.err = errText(null); }
    E.loading = false; if (ui.tab === "emails") render();
  }
  async function openThread(id){
    if (!via()) return;
    E.open = id; E.thread = null; E.tLoading = true; E.draft = ""; E.aiDraft = false; E.ask = ""; E.err = ""; render();
    try { const r = await mailCall({op: "get", id}); if (r && r.ok) { E.thread = r; const it = (E.list || []).find(x => x.id === id); if (it) it.unread = false; } else E.err = errText(r); } catch (e) { E.err = errText(null); }
    E.tLoading = false; if (ui.tab === "emails") render();
  }
  const threadText = () => (E.thread ? E.thread.messages.slice(-8).map(m => `${m.mine ? "Me" : m.from} (${whenLong(m.at)}): ${m.body}`).join("\n\n") : "");
  async function draft(){
    if (!E.thread || E.drafting) return;
    if (!aiReady()) { aiSetupSheet(true); return; }
    const ta = $("#emDraft"), ask = $("#emAsk"); if (ta) E.draft = ta.value; if (ask) E.ask = ask.value;
    E.drafting = true; render();
    try {
      const r = await aiCall({task: "rewrite", fast: true, maxTokens: 1500, temperature: 0.5,
        schema: {type: "OBJECT", properties: {reply: {type: "STRING", description: "The reply text only, no subject line"}}, required: ["reply"]},
        system: "You write replies for a college student to a message in their school's inbox (from an instructor, TA or classmate). Be polite, clear and brief, in the student's own voice (first person, natural, no flowery language). Answer what was asked. Don't invent facts, dates, grades or promises the student didn't state: if you need a detail from them, put a short [bracketed placeholder]. No subject line, no emojis. End with a simple sign-off only if it suits a message. Return JSON only.",
        parts: [{text: `Subject: ${E.thread.subject}\nCourse: ${E.thread.course || "unknown"}\n\nThe conversation so far:\n${threadText()}\n\n${E.draft ? "The student's draft so far (improve it):\n" + E.draft + "\n\n" : ""}${E.ask ? "What the student wants to say: " + E.ask : "Write a suitable reply to the last message."}`}]});
      const t = String((r.data || {}).reply || "").trim(); if (t) { E.draft = t; E.aiDraft = true; } else toast("I couldn't write a reply. Try telling me what to say.");
    } catch (e) { toast((e && e.message) || "I couldn't write a reply just now."); }
    E.drafting = false; if (ui.tab === "emails") render();
  }
  async function send(){
    const ta = $("#emDraft"); if (!via() || !E.open || E.sending) return;
    E.draft = ta ? ta.value : E.draft; const body = E.draft.trim(); if (!body) { toast("Write a reply first."); return; }
    // The desktop app asks in its own window before anything is sent (lms.js), so only the website asks here
    if (via().kind !== "desk" && !(await askBox({title: "Send This Reply?", text: `It goes to ${(E.thread && E.thread.names.filter(n => n).join(", ")) || "them"} through your school's inbox.`, yes: "Send Reply"}))) return;
    E.sending = true; render();
    try { const r = await mailCall({op: "send", id: E.open, body}); if (r && r.ok) { E.draft = ""; E.aiDraft = false; E.ask = ""; toast("Reply sent"); E.sending = false; await openThread(E.open); return; } if (!(r && r.error === "cancelled")) toast(errText(r)); } catch (e) { toast(errText(null)); }
    E.sending = false; if (ui.tab === "emails") render();
  }
  function note(){ return `<p class="mini em-note">Reads and answers your Canvas inbox. Brightspace and Blackboard don't let apps read their messages, so those inboxes stay on your school's site.</p>`; }
  function gate(){
    const head = `<div class="view-head"><h2>Emails</h2></div>`;
    return `${head}<div class="empty em-empty" style="text-align:left;margin-top:12px"><strong>Connect Canvas to See Your Emails</strong>
      ${hasDesk() ? `Sign in to Canvas under Settings, School Sites and your inbox appears here. <button class="btn small" data-act="lms-open">Connect a School Site</button>`
        : chromeDesktop() ? `Add the <a href="${esc(EXT_CHROME_URL)}" target="_blank" rel="noopener noreferrer">Studyboard School Sync extension</a> to Chrome and connect Canvas in it. Your latest messages then come in with your courses (to reply, open them in Canvas). In the Studyboard desktop app you can also read and answer them here.`
        : `Your Canvas inbox can be read in the Studyboard desktop app, which also lets you answer here, or on a computer with the Studyboard School Sync browser extension.`}
      ${E.err ? `<p class="mini em-err">${esc(E.err)}</p>` : ""}${note()}</div>`;
  }
  function viewEmails(){
    if (!via()) return gate();
    if (E.list === null && !E.loading && !E.err) setTimeout(load, 0);
    if (E.open) {
      const t = E.thread, who = t ? t.names.filter(Boolean).join(", ") : "";
      return `<div class="view-head"><button class="icon-btn" data-act="em-back" aria-label="Back to your inbox"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button><h2>${esc(t ? t.subject : "Message")}</h2></div>
        ${E.err ? `<p class="mini em-err">${esc(E.err)}</p>` : ""}
        ${E.tLoading ? `<p class="status-msg"><span class="ai-spin" aria-hidden="true"></span> Opening…</p>` : t ? `<p class="mini em-meta">${esc([t.course, who].filter(Boolean).join(" · "))}</p>
        <div class="em-thread">${t.messages.map(m => `<div class="em-msg${m.mine ? " mine" : ""}"><div class="em-from"><b>${esc(m.mine ? "You" : m.from)}</b><span class="mini">${esc(whenLong(m.at))}</span></div><div class="em-body">${esc(m.body)}</div>${m.files ? `<span class="mini">${m.files} attachment${m.files === 1 ? "" : "s"} (open it on your school's site)</span>` : ""}</div>`).join("")}</div>
        ${via().kind === "grab" ? `<p class="mini em-note">This came in through the Studyboard School Sync extension, so you can't reply from here. <a href="${esc(via().host)}/conversations" target="_blank" rel="noopener noreferrer">Reply in Canvas</a></p>` : `<div class="em-reply"><h3 class="fsec">Reply</h3>
          <div class="em-ai"><input type="text" id="emAsk" maxlength="300" placeholder="Tell ${aiWho("the AI")} what to say, like &quot;ask for an extension until Friday&quot;" value="${esc(E.ask)}" data-noenter><button type="button" class="btn small" data-act="em-draft" ${E.drafting ? "disabled" : ""}>${AI_ICON} ${E.drafting ? "Writing…" : "Draft with AI"}</button></div>
          ${E.aiDraft && E.draft ? `<p class="mini em-ai-note">Drafted by AI from this conversation. Check it's right before you send it.</p>` : ""}<textarea id="emDraft" rows="6" maxlength="10000" placeholder="Write your reply…" aria-label="Your reply">${esc(E.draft)}</textarea>
          <div class="row-actions"><span class="mini">Nothing is sent until you tap Send Reply.</span><span class="spacer"></span><button type="button" class="btn primary" data-act="em-send" ${E.sending ? "disabled" : ""}>${E.sending ? "Sending…" : "Send Reply"}</button></div></div>`}` : ""}`;
    }
    const list = E.list || [];
    const gb = via().kind === "grab" ? grabbed() : null;
    return `<div class="view-head"><h2>Emails</h2>${gb ? "" : `<button class="btn small" data-act="em-refresh" ${E.loading ? "disabled" : ""}>${E.loading ? "Loading…" : "Refresh"}</button>`}</div>
      ${gb ? `<p class="mini em-note" style="margin-top:0">Your Canvas inbox as it was read ${esc(when(new Date(gb.at).toISOString()))}. <button type="button" class="link-btn" data-act="em-grab-forget">Remove</button></p>` : ""}
      ${E.err ? `<p class="mini em-err">${esc(E.err)}</p>` : ""}
      ${E.loading && !list.length ? `<p class="status-msg"><span class="ai-spin" aria-hidden="true"></span> Reading your Canvas inbox…</p>` : !list.length && !E.err ? `<div class="empty em-empty"><strong>Your Inbox Is Empty</strong>No messages in Canvas right now.</div>` : `<ul class="em-list">${list.map(c => `<li><button type="button" class="em-item${c.unread ? " unread" : ""}" data-act="em-open" data-id="${esc(c.id)}"><span class="em-top"><b>${esc(c.subject)}</b><span class="mini">${esc(when(c.at))}</span></span><span class="mini em-who">${esc([c.course, c.names.filter(Boolean).join(", ")].filter(Boolean).join(" · "))}</span><span class="em-prev">${esc(c.preview)}</span></button></li>`).join("")}</ul>`}
      ${note()}`;
  }
  VIEWS.emails = viewEmails;
  // The Emails tab shows only once Canvas is connected: signed in (desktop), the extension, or a Canvas calendar link (its page then says how to bring the inbox in)
  window.SBEMAIL = {available(){ try { const L = window.SBLMS && SBLMS.canvas; return !!(via() || (window.SBEXT && SBEXT.has("canvas")) || (L && L.cfg && L.connected(L.cfg()))); } catch (e) { return false; } }};
  hook("act", (act, el) => {
    switch (act) {
      case "em-open": openThread(el.dataset.id); return true;
      case "em-back": E.open = null; E.thread = null; E.err = ""; render(); return true;
      case "em-refresh": load(); return true;
      case "em-draft": draft(); return true;
      case "em-send": send(); return true;
      case "em-grab-forget": try { localStorage.removeItem(GK); } catch (e) {} E.list = null; E.open = null; E.thread = null; render(); toast("Removed those messages"); return true;
    }
    return false;
  });
  document.addEventListener("input", e => { if (e.target.id === "emDraft") E.draft = e.target.value; else if (e.target.id === "emAsk") E.ask = e.target.value; });
  const st = document.createElement("style");
  st.textContent = `.em-list{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:8px}
.em-item{display:grid;gap:3px;width:100%;text-align:left;padding:12px 14px;border:1px solid var(--line);border-radius:14px;background:var(--surface);color:var(--ink);cursor:pointer;position:relative}
.em-item.unread{border-color:var(--accent);padding-left:22px}
.em-item.unread::before{content:"";position:absolute;left:9px;top:18px;width:8px;height:8px;border-radius:50%;background:var(--accent)}
.em-top{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.em-top b{font:700 .98rem var(--display);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.em-prev{font-size:.88rem;color:var(--muted);overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.em-note{margin:14px 0 0}.em-err{color:var(--late);margin:8px 0}.em-meta{margin:6px 0 0}
.em-thread{display:grid;gap:10px;margin-top:10px}
.em-msg{padding:10px 14px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
.em-msg.mine{background:color-mix(in srgb,var(--accent) 8%,var(--surface))}
.em-from{display:flex;justify-content:space-between;gap:10px;align-items:baseline;margin-bottom:4px}
.em-body{white-space:pre-wrap;overflow-wrap:anywhere;font-size:.95rem}
.em-reply{display:grid;gap:10px;margin-top:14px}
.em-ai{display:flex;gap:8px;align-items:center}.em-ai input{flex:1;min-width:0}
.em-reply textarea{min-height:130px}
.em-ai-note{margin:0;color:var(--muted)}`;
  document.head.appendChild(st);
})();

