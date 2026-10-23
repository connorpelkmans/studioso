/* ===== module: 96-capture-inbox.js ===== */
/* CAPTURE-INBOX-START
   Voice and shortcut capture ("Hey Siri, add to Studyboard", Gemini, Bixby, share sheet). The phone calls the capture-task Edge Function with a
   capture token; that puts a short text in this person's inbox on the server (supabase-capture.sql). This module pulls the inbox and turns each
   item into a normal task ON THIS DEVICE (so sync, trash and plan limits behave as usual), then acknowledges it. Order never changes:
   store the task, check it was saved, remember the id, THEN acknowledge. A crash anywhere in between can't lose a capture, and a task id made
   from the inbox id means a retry can't double-add. If window.SBCAPTURE (the capture pipeline) exists it makes the decisions instead of the
   quick-add reader below: SBCAPTURE.ingest(drafts, {source, onStored}) -> Promise of true | {stored:[ref,...]} | false. Each draft carries
   ref (the inbox id), text, due_date, due_time, due_text, course_hint, source, created_at. Refs it reports as stored are acknowledged. */
const CAP_DUP_MS = 10 * 60 * 1000;
const capNorm = s => String(s == null ? "" : s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const capKey = (text, due) => capNorm(text) + "|" + capNorm(due);
const capTs = r => Date.parse(r && r.created_at) || 0;
// The task id comes from the inbox id, so storing the same capture twice (crash, retry, two devices) lands on the same task.
const capTaskId = rowId => "cap" + String(rowId || "").replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 32);
const CAP_WHO = {siri: "Siri", shortcut: "Shortcuts", shortcuts: "Shortcuts", gemini: "Gemini", pixel: "Gemini", pixelgemini: "Gemini", google: "Google", assistant: "Google Assistant", bixby: "Bixby", galaxy: "Bixby", samsung: "Samsung", share: "the share sheet", sharesheet: "the share sheet", test: "a test"};
function capWho(sources){
  const names = [...new Set((sources || []).map(s => { const k = String(s || "").toLowerCase().replace(/[^a-z]/g, ""); const hit = Object.keys(CAP_WHO).find(w => k === w || k.startsWith(w)); return hit ? CAP_WHO[hit] : "your voice assistant"; }))];
  return names.length === 1 ? names[0] : "voice capture";
}
// Splits rows into: fresh (store them), ackOnly (already stored here, or a repeat of something just added: only acknowledge).
// o: {seen: Set of inbox ids stored on this device, hasTask(id), recent: [{key, at}] (tasks made in the last minutes)}
function capDedupe(rows, o){
  o = o || {};
  const seen = o.seen || new Set(), keys = (o.recent || []).map(r => ({k: r.key, at: r.at})), fresh = [], ackOnly = [];
  (rows || []).filter(r => r && r.id).slice().sort((a, b) => capTs(a) - capTs(b)).forEach(r => {
    if (seen.has(r.id) || (o.hasTask && o.hasTask(capTaskId(r.id)))) { ackOnly.push(r.id); return; }
    const key = capKey(r.text, r.due_date || r.due_text), at = capTs(r);
    if (keys.some(x => x.k === key && Math.abs(x.at - at) <= CAP_DUP_MS)) { ackOnly.push(r.id); return; }
    keys.push({k: key, at}); fresh.push(r);
  });
  return {fresh, ackOnly};
}
// One inbox row -> a task-like item, read with the quick-add reader (d.qaLocal, d.qaConfident, d.qaCourse) in the person's own date and time zone.
// sure=false when a date or course was said but couldn't be understood: those are the ones worth a look.
function capConvert(row, d){
  const text = String(row.text || "").trim(), dueText = String(row.due_text || "").trim(), hint = String(row.course_hint || "").trim();
  const sentence = dueText && !row.due_date ? text + " " + dueText : text;
  const x = Object.assign({}, d.qaLocal(sentence));
  let sure = !!d.qaConfident(sentence, x);
  if (row.due_date) { x.due = row.due_date; if (row.due_time) x.time = String(row.due_time).slice(0, 5); }
  else if (dueText && !x.due) sure = false;
  if (!x.courseId && hint) { const m = d.qaCourse ? d.qaCourse(hint) : null; if (m && m.course) x.courseId = m.course.id; else sure = false; }
  x.title = String(x.title || text).slice(0, 200);
  return Object.assign(x, {id: capTaskId(row.id), ref: row.id, source: row.source, sure});
}
const capDraft = row => ({ref: row.id, id: row.id, kind: "task", due: row.due_date ? row.due_date + (row.due_time ? "T" + String(row.due_time).slice(0, 5) : "") : row.due_text || "", course: row.course_hint || "", createdAt: Date.parse(row.created_at) || 0, text: row.text, due_date: row.due_date || null, due_time: row.due_time || null, due_text: row.due_text || null, course_hint: row.course_hint || null, source: row.source, created_at: row.created_at});
// The whole round, with every outside step passed in so the order can be tested.
// d: {dedupe(), convert(row), addTasks(items), verifySaved(ids), seenAdd(ids), ack(ids), ingest?(drafts), onTest?(rows)}
async function capProcess(rows, d){
  const out = {added: 0, acked: 0, tests: 0, duplicates: 0, failed: false, ackFailed: false, stored: []};
  const list = (rows || []).filter(r => r && r.id), tests = list.filter(r => r.source === "test");
  // Email to Studyboard: forwarded emails go to their own reader (d.email); two emails can share a subject, so they skip the text dedupe
  // (the server already drops the same Message-ID twice) and are only skipped when this device has stored them before.
  const mailAll = d.email ? list.filter(r => r.source === "email") : [], real = list.filter(r => r.source !== "test" && !mailAll.includes(r));
  const dd = capDedupe(real, d.dedupe ? d.dedupe() : {});
  const seen0 = mailAll.length && d.dedupe ? d.dedupe().seen || new Set() : new Set(), mail = mailAll.filter(r => !seen0.has(r.id));
  mailAll.filter(r => seen0.has(r.id)).forEach(r => dd.ackOnly.push(r.id));
  out.duplicates = dd.ackOnly.length; out.tests = tests.length;
  let stored = [], mailStored = [];
  if (mail.length) {
    let got = []; try { got = (await d.email(mail)) || []; } catch (e) { got = []; }
    const ids = mail.map(r => r.id); mailStored = got.filter(id => ids.includes(id));
    if (mailStored.length) { d.seenAdd(mailStored); out.added += mailStored.length; }
  }
  if (dd.fresh.length) {
    if (d.ingest) {
      let res; try { res = await d.ingest(dd.fresh.map(capDraft)); } catch (e) { res = false; }
      const all = dd.fresh.map(r => r.id);
      stored = res === true || res === undefined ? all : res && Array.isArray(res.stored) ? res.stored.filter(id => all.includes(id)) : [];
      if (!stored.length) out.failed = true;
    } else {
      const items = dd.fresh.map(r => d.convert(r)), ids = items.map(x => x.id);
      try { await d.addTasks(items); } catch (e) { out.failed = true; }
      if (!out.failed && d.verifySaved(ids)) stored = dd.fresh.map(r => r.id); else out.failed = true;
    }
    if (stored.length) { d.seenAdd(stored); out.added += stored.length; }
  }
  stored = stored.concat(mailStored);
  out.stored = stored;
  const toAck = dd.ackOnly.concat(tests.map(r => r.id), stored);
  if (toAck.length) { try { await d.ack(toAck); out.acked = toAck.length; } catch (e) { out.ackFailed = true; } }
  if (tests.length && d.onTest) { try { d.onTest(tests); } catch (e) {} }
  return out;
}
/* CAPTURE-INBOX-PURE-END */
(() => {
  const SEEN_KEY = "studyboard:capSeen", LAST_KEY = "studyboard:capLast";
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; };
  const seenSet = () => { try { return new Set(JSON.parse(ls(SEEN_KEY) || "[]")); } catch (e) { return new Set(); } };
  const seenAdd = ids => { const a = [...seenSet(), ...ids].slice(-300); ls(SEEN_KEY, JSON.stringify(a)); };
  const missing = err => { const m = String(err && (err.message || err.code) || ""); return err && (err.code === "42P01" || err.code === "PGRST205" || err.code === "PGRST202" || err.status === 404 || /does not exist|Could not find the (table|function)|schema cache/i.test(m)); };
  // The installed iOS/Android app keeps its own copy of ONE token (Keychain / Keystore) so Siri, Gemini and the share sheet can send while the app is closed.
  const NATIVE_KEY = "studyboard:capNativeTok";   // id (never the token) of the token the app was given
  const nativeBridge = () => window.StudyboardNative || null;
  function nativeSave(t){
    try { const nb = nativeBridge(); if (nb && typeof nb.saveCaptureToken === "function" && t && t.token) { const c = sbConfig(); nb.saveCaptureToken(t.token, c && c.url ? c.url.replace(/\/+$/, "") : ""); ls(NATIVE_KEY, t.id); } } catch (e) {}
  }
  function nativeClear(){ try { const nb = nativeBridge(); if (nb && typeof nb.clearCaptureToken === "function") nb.clearCaptureToken(); ls(NATIVE_KEY, ""); } catch (e) {} }
  // On start: if the token the app holds was revoked (on another device), or nobody is signed in, let the app forget it.
  async function nativeCheck(){
    const id = ls(NATIVE_KEY); if (!id || !nativeBridge()) return;
    if (!sbUser && !(sb && sbStarting)) { if (typeof sb !== "undefined" && sb) nativeClear(); return; }
    if (!ready()) return;
    try { const {data, error} = await sb.rpc("capture_list_tokens"); if (!error && Array.isArray(data) && !data.some(x => x.id === id && !x.revoked_at)) nativeClear(); } catch (e) {}
  }
  document.addEventListener("click", e => { const b = e.target.closest && e.target.closest('[data-act="sb-signout"]'); if (b) nativeClear(); }, true);
  const endpoint = () => { const c = sbConfig(); return c && c.url ? c.url.replace(/\/+$/, "") + "/functions/v1/capture-task" : ""; };
  const ready = () => !inClaude() && typeof sbActive === "function" && sbActive() && !sbStarting;

  /* ---------- Pulling the inbox ---------- */
  let busy = false, off = false, lastAt = 0, onTestRows = null;
  function addTasks(items){
    const today = todayISO();
    const changes = items.map(x => {
      const due = isDate(x.due) ? x.due : "";
      let start = due ? addDays(due, -(SPAN[x.type] ?? 3)) : today;
      if (start < today) start = today; if (due && start > due) start = due;
      const est = MILESTONE(x.type) ? null : (typeof localEstimate === "function" ? localEstimate(x).hours : null);
      const t = newTask({id: x.id, title: x.title, type: x.type || "Assignment", courseId: x.courseId || "", due, time: x.time || "", start,
        hours: isNum(x.hours) ? Number(x.hours) : isNum(est) ? est : null, weight: x.weight || null, priority: x.priority || (x.type === "Exam" ? "high" : "med"), difficulty: "med"});
      return {kind: "task", id: t.id, after: t};
    });
    const who = capWho(items.map(x => x.source)), n = changes.length, nodate = items.filter(x => !x.due).length;
    applyChanges(changes, `Added ${n} task${n === 1 ? "" : "s"} from ${who}${nodate ? ` (${nodate === n ? "none has" : nodate + " without"} a due date)` : ""}`);
  }
  function verifySaved(ids){ try { const raw = localStorage.getItem(LS2) || ""; return ids.every(id => raw.indexOf('"' + id + '"') >= 0); } catch (e) { return false; } }
  const deps = () => ({
    dedupe: () => ({seen: seenSet(), hasTask: id => !!getItem("task", id),
      recent: tasksArr().filter(t => t.created && Date.now() - t.created < CAP_DUP_MS).map(t => ({key: capKey(t.title, t.due), at: t.created}))}),
    convert: r => capConvert(r, {qaLocal, qaConfident, qaCourse}),
    addTasks, verifySaved, seenAdd,
    ack: async ids => { const {error} = await sb.rpc("capture_ack", {p_ids: ids}); if (error) throw error; },
    ingest: window.SBCAPTURE && typeof window.SBCAPTURE.ingest === "function" ? drafts => {
      const sources = drafts.map(x => x.source);
      return Promise.resolve(window.SBCAPTURE.ingest(drafts, {source: sources.length && sources.every(s => s === sources[0]) ? sources[0] : "voice", who: capWho(sources), onStored: refs => { seenAdd(refs); sb.rpc("capture_ack", {p_ids: refs}).then(() => {}, () => {}); }}));
    } : null,
    onTest: rows => { if (onTestRows) onTestRows(rows); else toast("Your test capture arrived"); },
    email: window.SBPRO && typeof window.SBPRO.emailIngest === "function" ? rows => window.SBPRO.emailIngest(rows) : null
  });
  async function pull(force){
    if (busy || off || !ready()) return null;
    if (!force && (document.hidden || Date.now() - lastAt < 15000)) return null;
    busy = true; lastAt = Date.now();
    try {
      const {data, error} = await sb.rpc("capture_pull_inbox", {p_limit: 50});
      if (error) { if (missing(error)) off = true; return null; }   // SQL not run yet: stay quiet
      if (!Array.isArray(data) || !data.length) return {added: 0};
      return await capProcess(data, deps());
    } catch (e) { return null; }
    finally { busy = false; }
  }
  const tick = () => pull(false);
  setTimeout(tick, 2500); setTimeout(tick, 9000); setTimeout(tick, 25000);
  setTimeout(nativeCheck, 6000); setTimeout(nativeCheck, 30000);
  window.addEventListener("focus", tick);
  window.addEventListener("online", () => pull(true));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });
  setInterval(() => { if (!document.hidden) tick(); }, 4 * 60 * 1000);

  /* ---------- Settings: Voice assistants & shortcuts ---------- */
  const S = {tokens: null, err: "", busy: false, tok: null, testBusy: false, testMsg: "", missing: false};
  const PRESETS = ["Siri on iPhone", "Pixel Gemini", "Galaxy Bixby", "Other"];
  const ago = s => { if (!s) return "never"; const m = Math.round((Date.now() - Date.parse(s)) / 60000); return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : Math.round(m / 1440) + " d ago"; };
  function injectCss(){
    if (document.getElementById("capvCss")) return;
    const st = document.createElement("style"); st.id = "capvCss";
    st.textContent = `.capv-sheet .sheet-body{display:grid;gap:12px}.capv-box{border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:var(--surface);display:grid;gap:8px}
.capv-tok{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.capv-code{font:600 .8rem ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all;background:color-mix(in srgb,var(--accent) 8%,var(--surface));border:1px solid var(--line);border-radius:8px;padding:6px 8px;flex:1;min-width:200px;user-select:all}
.capv-row{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:8px}.capv-row:first-child{border-top:0;padding-top:0}
.capv-sheet details{border:1px solid var(--line);border-radius:12px;padding:8px 12px;background:var(--surface)}.capv-sheet summary{font-weight:700;cursor:pointer}.capv-sheet ol,.capv-sheet ul{margin:8px 0;padding-left:20px;display:grid;gap:4px}
.capv-pre{white-space:pre-wrap;word-break:break-word;font:.78rem ui-monospace,SFMono-Regular,Menlo,monospace;background:color-mix(in srgb,var(--ink) 5%,var(--surface));border-radius:8px;padding:8px;margin:6px 0}
.capv-warn{background:color-mix(in srgb,var(--warn) 12%,var(--surface));border:1px solid color-mix(in srgb,var(--warn) 40%,var(--line));border-radius:10px;padding:8px 10px}
.capv-sheet input[type=text]{min-width:0;flex:1}@media(max-width:600px){.capv-code{min-width:0}}`;
    document.head.appendChild(st);
  }
  const copyText = async v => {
    try { await navigator.clipboard.writeText(v); toast("Copied"); return; } catch (e) {}
    try { const t = document.createElement("textarea"); t.value = v; t.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); toast("Copied"); } catch (e) { toast("Couldn't copy. Select the text and copy it yourself."); }
  };
  const bearer = () => "Bearer " + (S.tok ? S.tok.token : "YOUR_TOKEN");
  const copyBox = (label, value, key) => `<div class="capv-tok"><span class="mini" style="flex:none;min-width:84px">${esc(label)}</span><span class="capv-code">${esc(value)}</span><button type="button" class="btn small" data-capx="copy" data-k="${key}">Copy</button></div>`;
  function bodyExample(){ return `{"text": "Read chapter 4 for bio", "due": "friday 5pm", "source": "siri"}`; }
  function guides(){
    const url = endpoint() || "https://your-project.supabase.co/functions/v1/capture-task";
    return `
    <details><summary>iPhone and iPad: "Hey Siri, Add to Studyboard"</summary>
      <p class="mini"><b>Needs:</b> the free Shortcuts app (built in) and a capture token. Works with Siri without installing anything else. Try it once after setting it up to make sure Siri hears the shortcut's name.</p>
      <ol class="mini">
        <li>Open <b>Shortcuts</b>, tap <b>+</b>, and name it <b>Add to Studyboard</b>. That name is what you say to Siri.</li>
        <li>Add <b>Ask for Input</b>: Input Type <b>Text</b>, Prompt "What's the task?". (Siri will ask out loud and you answer by voice.)</li>
        <li>Add <b>Get Contents of URL</b>. URL: the Address in "Values to copy" above. Tap <b>Show More</b>: Method <b>POST</b>; Headers: <code>Authorization</code> = your <code>Bearer</code> value, <code>Content-Type</code> = <code>application/json</code>; Request Body <b>JSON</b> with a Text field <code>text</code> = the <b>Provided Input</b> variable and a Text field <code>source</code> = <code>siri</code>.</li>
        <li>Add <b>Get Dictionary Value</b> (Get <b>Value</b> for <code>speech</code> in <b>Contents of URL</b>), then <b>Speak Text</b> with that value. Siri then says "Added to Studyboard: ...".</li>
        <li>Say <b>"Hey Siri, Add to Studyboard"</b>, then say the task, for example "Read chapter 4 for bio due Friday 5pm". Dates in words are read by the app when it opens.</li>
      </ol>
      <p class="mini"><b>Share sheet:</b> in the shortcut's settings turn on <b>Show in Share Sheet</b> and let it receive <b>Text</b> and <b>URLs</b>, then use <b>Shortcut Input</b> instead of Ask for Input.</p>
      <p class="mini">Copy-paste action list:</p><div class="capv-pre">1. Ask for Input (Text) "What's the task?"
2. Get Contents of URL
   URL: ${esc(url)}
   Method: POST
   Headers: Authorization: Bearer YOUR_TOKEN | Content-Type: application/json
   Body (JSON): text = Provided Input, source = siri
3. Get Dictionary Value: speech from Contents of URL
4. Speak Text: Dictionary Value</div>
      <p class="mini"><b>Later, with the installed Studyboard app (iOS wrapper):</b> the app's App Intents are meant to let you say "Hey Siri, add &lt;task&gt; to Studyboard" with no setup. That needs the wrapper app from the App Store and is not available in the website version.</p>
    </details>
    <details><summary>Pixel and other Android phones with Gemini</summary>
      <p class="mini"><b>Needs:</b> a capture token and the free, open-source <b>HTTP Shortcuts</b> app from Google Play. Gemini cannot call a web address by itself, so the HTTP Shortcuts app does the sending.</p>
      <ol class="mini">
        <li>In HTTP Shortcuts tap <b>+</b>, choose <b>Regular Shortcut</b>, name it <b>Add to Studyboard</b>.</li>
        <li>Method <b>POST</b>, URL: the Address in "Values to copy" above. Under <b>Headers</b> add <code>Authorization</code> = your <code>Bearer</code> value. Under <b>Request Body</b> choose <b>Custom Text</b>, content type <code>application/json</code>, and use this body: <code>{"text": "{task}", "source": "gemini"}</code>.</li>
        <li>Under <b>Variables</b> add a <b>Text input</b> variable named <code>task</code> ("Type or dictate with the keyboard mic"). Under <b>Response Handling</b> choose <b>Show toast</b>.</li>
        <li>Say <b>"Hey Google, open HTTP Shortcuts"</b> and tap <b>Add to Studyboard</b>, or put the shortcut on your home screen. Whether Gemini can start a shortcut by its own name depends on your Android and Gemini version, so try "Hey Google, Add to Studyboard" and, if it doesn't work, use the home screen shortcut or the Tasker route (Tasker's <b>HTTP Request</b> action with the same URL, header and body).</li>
      </ol>
      <p class="mini"><b>Later, with the installed Studyboard app (Android wrapper):</b> App Actions and Gemini's app functions are planned to let Gemini add a task directly. They need the wrapper app and are not available in the website version.</p>
    </details>
    <details><summary>Samsung Galaxy: Bixby, Modes and Routines, Gemini</summary>
      <p class="mini"><b>Needs:</b> a capture token and the free <b>HTTP Shortcuts</b> app (steps as for Pixel).</p>
      <ol class="mini">
        <li>Build the <b>Add to Studyboard</b> shortcut in HTTP Shortcuts exactly as in the Pixel steps.</li>
        <li><b>Bixby voice:</b> open <b>Settings, Advanced features, Bixby Routines</b> (or <b>Modes and Routines</b>). Make a routine: <b>If</b> a Bixby Quick Command / voice phrase "Add to Studyboard", <b>Then</b> <b>Open app</b> HTTP Shortcuts. Bixby can open the app, and you then tap the shortcut. Bixby cannot send the request on its own.</li>
        <li>If a tool can't set headers (some Quick Commands only open a link), switch on <b>Allow use in a link</b> when you create the token and use <code>${esc(url)}?token=...&amp;text=...</code>. <b>Tradeoff:</b> links get written to logs, history and sometimes backups, so the token is easier to leak. It can still only add inbox items, and you can revoke it. Prefer the header method.</li>
        <li><b>Gemini on Galaxy</b> works like Pixel above.</li>
        <li><b>Share target (needs the installed Studyboard Android app):</b> Samsung's "Open app" routine plus the app's share target can pass text straight to Studyboard once the wrapper app exists.</li>
      </ol>
    </details>`;
  }
  function html(){
    const signed = ready() || (typeof sbActive === "function" && sbActive());
    if (!signed) return `<p style="margin:0">Sign in first. Voice capture drops tasks into your account's inbox, so it needs an account.</p><button type="button" class="btn primary" data-capx="signin">Sign in</button>`;
    if (S.missing) return `<p class="capv-warn mini" style="margin:0">${esc(srvSetup("Voice capture", "supabase-capture.sql"))}</p>`;
    const toks = (S.tokens || []).filter(t => !t.revoked_at), url = endpoint();
    return `
      <p class="mini" style="margin:0">Say "add <i>read chapter 4 due Friday</i> to my Studyboard" to your phone's assistant and the task shows up here. A <b>capture token</b> lets one shortcut add tasks to your inbox, and nothing else: it can't read your tasks. Free for everyone.</p>
      ${S.err ? `<p class="capv-warn mini" role="alert" style="margin:0">${esc(S.err)}</p>` : ""}
      <div class="capv-box">
        <b>Your capture tokens</b>
        ${S.tokens === null ? `<p class="mini" style="margin:0">Loading…</p>` : toks.length ? toks.map(t => `<div class="capv-row"><span>${esc(t.label)}<span class="sub" style="display:block">Last used ${esc(ago(t.last_used_at))} · ${t.use_count} use${t.use_count === 1 ? "" : "s"}${t.allow_get ? " · link use on" : ""}</span></span><button type="button" class="btn small" data-capx="revoke" data-id="${esc(t.id)}">Revoke</button></div>`).join("") : `<p class="mini" style="margin:0">No tokens yet. Make one for each phone or shortcut so you can revoke them separately (up to 5).</p>`}
      </div>
      ${S.tok ? `<div class="capv-box" role="status"><b>Copy your new token now</b>
        <p class="mini" style="margin:0">This is the only time it's shown. If you lose it, revoke it and make a new one.</p>
        ${copyBox("Token", S.tok.token, "tok")}${copyBox("Header", bearer(), "bearer")}
        <button type="button" class="btn small" data-capx="hide">I've Saved It, Hide It</button></div>` : ""}
      <form class="capv-box" data-capx-form="create">
        <b>Make a token</b>
        <div class="capv-tok">${PRESETS.map(p => `<button type="button" class="btn small" data-capx="preset" data-v="${esc(p)}">${esc(p)}</button>`).join("")}</div>
        <div class="capv-tok"><input type="text" name="label" maxlength="40" placeholder="Name, e.g. Siri on iPhone" aria-label="Token name" data-noenter><button type="submit" class="btn primary small" ${S.busy || toks.length >= 5 ? "disabled" : ""}>${S.busy ? "Making…" : "Make Token"}</button></div>
        <label class="mi-check"><input type="checkbox" name="get"> Also allow use in a link (only for tools that can't send a header; less safe)</label>
        ${toks.length >= 5 ? `<p class="mini" style="margin:0">You have 5 active tokens. Revoke one to make another.</p>` : ""}
      </form>
      <div class="capv-box"><b>Values to copy</b>
        ${copyBox("Address", url || "(sign in to see it)", "url")}${copyBox("Method", "POST", "method")}${copyBox("Header", bearer(), "bearer")}${copyBox("Body", bodyExample(), "body")}
        <p class="mini" style="margin:0">Fields: <code>text</code> (required, 500 characters), <code>due</code> (words like "friday 5pm" or a date like 2026-10-09), <code>course</code>, <code>source</code>. Replies include <code>speech</code> for a spoken answer.</p>
      </div>
      ${guides()}
      <div class="capv-box"><b>Test it</b>
        <p class="mini" style="margin:0">Sends a test through the real address with your token and waits for it to arrive in your inbox. It doesn't add a task.</p>
        <div class="capv-tok"><input type="text" name="testtok" id="capvTestTok" placeholder="${S.tok ? "Using the token you just made" : "Paste a token to test"}" aria-label="Token to test" autocomplete="off" data-noenter><button type="button" class="btn small" data-capx="test" ${S.testBusy ? "disabled" : ""}>${S.testBusy ? "Testing…" : "Send Test"}</button></div>
        ${S.testMsg ? `<p class="mini" role="status" style="margin:0">${esc(S.testMsg)}</p>` : ""}
      </div>
      <p class="mini" style="margin:0">If a voice assistant says it can't do this, that's the assistant's limit, not Studyboard's: use the Shortcuts or HTTP Shortcuts route above.</p>`;
  }
  const paint = () => { const b = dlg.querySelector(".capv-body"); if (!b) return; const keep = dlg.scrollTop; b.innerHTML = html(); dlg.scrollTop = keep; };
  async function loadTokens(){
    if (!(sb && sbUser)) return;
    const {data, error} = await sb.rpc("capture_list_tokens");
    if (error) { if (missing(error)) S.missing = true; else S.err = "Couldn't load your tokens. Check your connection and try again."; }
    else { S.tokens = data || []; S.missing = false; S.err = ""; }
    paint();
  }
  function open(){
    injectCss(); S.err = ""; S.testMsg = ""; S.tokens = null; S.missing = false;
    openSheet(`<div class="sheet capv-sheet">${head("Voice Assistants & Shortcuts")}<div class="sheet-body capv-body"></div><div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Done</button></div></div>`);
    dlg.addEventListener("close", () => { S.tok = null; }, {once: true});
    paint(); loadTokens();
  }
  async function create(form){
    const label = String(form.label.value || "").trim();
    if (!label) { S.err = "Give the token a name so you can tell your shortcuts apart."; paint(); return; }
    S.busy = true; S.err = ""; paint();
    const {data, error} = await sb.rpc("capture_create_token", {p_label: label, p_allow_get: !!form.get.checked});
    S.busy = false;
    if (error) { if (missing(error)) S.missing = true; else S.err = /SB_CAPTURE_LIMIT/.test(error.message || "") ? "You already have 5 active tokens. Revoke one first." : "Couldn't make the token. Check your connection and try again."; paint(); return; }
    S.tok = data; nativeSave(data);
    await loadTokens();
    const el = dlg.querySelector(".capv-body"); if (el) el.scrollTop = 0;
  }
  async function revoke(id){
    if (!(await askBox({title: "Revoke This Token?", text: "Any shortcut using it stops working right away.", yes: "Revoke", danger: true}))) return;
    const {error} = await sb.rpc("capture_revoke_token", {p_id: id});
    if (error) S.err = "Couldn't revoke it. Try again."; else { S.err = ""; toast("Token revoked"); if (ls(NATIVE_KEY) === id) nativeClear(); }
    await loadTokens();
  }
  async function test(){
    const inp = dlg.querySelector("#capvTestTok"), token = ((inp && inp.value) || "").trim() || (S.tok && S.tok.token) || "";
    if (!/^sbc_[A-Za-z0-9_-]{30,80}$/.test(token)) { S.testMsg = "Paste a capture token first (they start with sbc_)."; paint(); return; }
    if (!endpoint()) { S.testMsg = "Sign in first."; paint(); return; }
    S.testBusy = true; S.testMsg = "Sending…"; paint();
    let arrived = false; const t0 = Date.now();
    onTestRows = () => { arrived = true; };
    try {
      const r = await fetch(endpoint(), {method: "POST", headers: {"Content-Type": "application/json", Authorization: "Bearer " + token, "Idempotency-Key": "test-" + uid()}, body: JSON.stringify({text: "Studyboard test capture", source: "test"})});
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { S.testMsg = r.status === 401 ? "The server refused that token (wrong, revoked, or not from this account)." : r.status === 429 ? "Too many captures just now. Wait a few minutes." : `The server answered ${r.status}${j && j.error ? ": " + j.error : ""}.`; }
      else {
        S.testMsg = `The server said: "${j.speech || j.message}". Waiting for it to reach your inbox…`; paint();
        for (let i = 0; i < 8 && !arrived; i++) { await new Promise(res => setTimeout(res, 1200)); await pull(true); }
        S.testMsg = arrived ? `It works. The test arrived in your inbox in ${Math.max(1, Math.round((Date.now() - t0) / 1000))} s. (Spoken reply: "${j.speech}")` : "The server accepted it but it hasn't reached the app yet. Close this and it will arrive within a few minutes.";
      }
    } catch (e) { S.testMsg = "Couldn't reach the server. Check your connection and try again."; }
    onTestRows = null; S.testBusy = false; loadTokens();
  }
  dlg.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-capx]"); if (!b || !dlg.querySelector(".capv-sheet")) return;
    const k = b.dataset.capx;
    if (k === "copy") { const v = {tok: S.tok && S.tok.token, bearer: bearer(), url: endpoint(), method: "POST", body: bodyExample()}[b.dataset.k]; if (v) copyText(v); }
    else if (k === "preset") { const i = dlg.querySelector('[name="label"]'); if (i) { i.value = b.dataset.v === "Other" ? "" : b.dataset.v; i.focus(); } }
    else if (k === "revoke") revoke(b.dataset.id);
    else if (k === "hide") { S.tok = null; paint(); }
    else if (k === "test") test();
    else if (k === "signin") { if (dlg.open) dlg.close(); setTimeout(() => { try { sbAsk(); } catch (err) {} }, 60); }
  });
  dlg.addEventListener("submit", e => { const f = e.target.closest && e.target.closest("[data-capx-form]"); if (f) { e.preventDefault(); create(f); } });
  const rowHtml = group => `<button data-act="cap-voice-open" data-group="${group}"><span>Voice Assistants &amp; Shortcuts<span class="sub">Add tasks by asking Siri, Gemini or Bixby, or from the share sheet</span></span></button>`;
  hook("act", act => { if (act !== "cap-voice-open") return false; if (dlg.open) dlg.close(); setTimeout(open, 40); return true; });
  // With the capture pipeline present, the row lives in its Quick capture category; without it, a row under Account and Sync.
  let registered = false;
  const register = () => { const P = window.SBCAPTURE; if (registered || !P || typeof P.settingsExtra !== "function") return; registered = true; try { P.settingsExtra(() => rowHtml("capture")); } catch (e) { registered = false; } };
  setTimeout(register, 0); window.addEventListener("load", register);
  hook("menu", () => { register(); return inClaude() || registered ? "" : rowHtml("account"); });

  window.SBCAPINBOX = {pull: () => pull(true), open, endpoint};
})();
/* CAPTURE-INBOX-END */

