/* ===== module: 49-feedback.js ===== */
/* Report a Bug or Send Feedback */
(() => {
  const APP_VERSION = "1.15.1";
  const QKEY = "studyboard:bugq", CID = "studyboard:bugcid", LASTSEND = "studyboard:bugsent";
  const MAX_SHOT = 280000;
  let shot = "", busy = false, flushing = false;

  const readQ = () => { try { const q = JSON.parse(localStorage.getItem(QKEY) || "[]"); return Array.isArray(q) ? q : []; } catch (e) { return []; } };
  const writeQ = q => { try { if (q.length) localStorage.setItem(QKEY, JSON.stringify(q.slice(-5))); else localStorage.removeItem(QKEY); return true; } catch (e) { return false; } };
  const clientId = () => { try { let c = localStorage.getItem(CID); if (!c) { c = uid() + uid(); localStorage.setItem(CID, c); } return c; } catch (e) { return "none"; } };
  const server = () => { const c = sbConfig() || (SB_HOSTED ? SB_DEFAULT : null); return c && c.url && c.key ? {url: String(c.url).replace(/\/+$/, ""), key: c.key} : null; };

  function diagnostics(){
    const d = {version: APP_VERSION, build: BUILD_ID, tab: ui.tab, at: new Date().toISOString()};
    try { d.ua = String(navigator.userAgent || "").slice(0, 220); } catch (e) {}
    try { d.platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || ""; } catch (e) {}
    try { d.screen = `${innerWidth}x${innerHeight} @${devicePixelRatio || 1}x`; d.lang = navigator.language; } catch (e) {}
    try { d.standalone = !!(matchMedia("(display-mode: standalone)").matches || navigator.standalone); d.online = navigator.onLine !== false; } catch (e) {}
    try { if (DESK) d.desktop = {platform: DESK.platform, version: DESK.version}; } catch (e) {}
    try { d.plan = window.StudyboardPlan ? window.StudyboardPlan.tier() : ""; } catch (e) {}
    try { d.signedIn = !!sbUser; d.theme = document.documentElement.dataset.skin || "classic"; d.dark = document.documentElement.dataset.theme || ""; } catch (e) {}
    d.errors = ERRLOG.slice(-10).map(e => ({ago: Math.round((Date.now() - e.t) / 1000) + "s", k: e.k, m: window.SBERR && SBERR.scrub ? SBERR.scrub(e.m) : "[hidden]"}));
    return d;
  }

  /* Sending */
  const wire = r => { const w = Object.assign({}, r); w.diagnostics = Object.assign({}, r.diagnostics, {ref: r.client_ref}); delete w.client_ref; return w; };
  async function post(row){
    const sv = server();
    if (!sv) return "offline";
    const headers = {apikey: sv.key, "Content-Type": "application/json", Prefer: "return=minimal"};
    try { if (sb && sbUser) { const {data} = await sb.auth.getSession(); const t = data && data.session && data.session.access_token; if (t) headers.Authorization = "Bearer " + t; } } catch (e) {}
    let res;
    try { res = await fetch(sv.url + "/rest/v1/bug_reports", {method: "POST", headers, body: JSON.stringify(wire(row))}); }
    catch (e) { return "offline"; }
    if (res.ok) return "sent";
    let body = ""; try { body = await res.text(); } catch (e) {}
    if (res.status === 404 || /PGRST205|42P01|does not exist/i.test(body)) return "missing";
    if (res.status === 429 || /SB_RATE/.test(body)) return "limited";
    if (res.status >= 500 || res.status === 408) return "offline";
    if (row.category === "ai") return post(Object.assign({}, row, {category: "other", message: ("[AI response] " + row.message).slice(0, 2000)}));
    return "rejected";
  }
  async function flush(){
    if (flushing || navigator.onLine === false) return;
    let q = readQ(); if (!q.length) return;
    flushing = true;
    try {
      let sent = 0;
      for (const row of q.slice()) {
        const r = await post(row);
        if (r === "offline" || r === "limited") break;
        q = q.filter(x => x !== row && x.client_ref !== row.client_ref);
        writeQ(q);
        if (r === "sent") sent++;
      }
      if (sent) toast(`Thanks! ${sent === 1 ? "Your saved report was" : sent + " saved reports were"} sent.`);
    } finally { flushing = false; }
  }
  window.addEventListener("online", () => setTimeout(flush, 1500));
  hook("boot", () => setTimeout(flush, 8000));

  /* Screenshot */
  function shrink(file){
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        try {
          let w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, 1100 / Math.max(w, h));
          let out = "";
          for (let tries = 0; tries < 5; tries++) {
            const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
            const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
            out = c.toDataURL("image/jpeg", Math.max(0.4, 0.72 - tries * 0.08));
            if (out.length <= MAX_SHOT) break;
            k *= 0.75;
          }
          URL.revokeObjectURL(url);
          out.length <= MAX_SHOT ? resolve(out) : reject(new Error("big"));
        } catch (e) { URL.revokeObjectURL(url); reject(e); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("img")); };
      img.src = url;
    });
  }

  /* The form */
  function open(opts){
    opts = opts || {};
    shot = ""; busy = false;
    const ai = opts.ai && typeof opts.ai === "object" ? {text: String(opts.ai.text || "").slice(0, 1400), feature: String(opts.ai.feature || "").slice(0, 40)} : null;
    const email = (sbUser && sbUser.email) || "";
    const queued = readQ().length;
    openSheet(`<form class="sheet bug-sheet">${head(ai ? "Report an AI Response" : "Report a Bug or Send Feedback")}
      <div class="sheet-body">
        <p class="mini" style="margin:0">${ai ? "Was an AI answer wrong, harmful, offensive or inappropriate? Tell us what happened. Every report is read by the person who makes the app." : "Tell us what went wrong, or what would make Studyboard better. Every report is read by the person who makes the app."}</p>
        ${queued ? `<p class="mini" style="margin:0">${queued} earlier report${queued === 1 ? " is" : "s are"} waiting to send when you're online.</p>` : ""}
        <label class="f">What is it about?<select name="cat">${[["bug", "Something is broken"], ["ai", "An AI response was wrong or inappropriate"], ["idea", "An idea or feature request"], ["confusing", "Something is confusing"], ["other", "Something else"]].map(([v, l]) => `<option value="${v}" ${v === (opts.cat || "bug") ? "selected" : ""}>${l}</option>`).join("")}</select></label>
        <label class="f"><span class="lh">What happened?<span class="req" aria-hidden="true">*</span></span><textarea name="msg" id="bugMsg" rows="4" maxlength="2000" placeholder="${ai ? "What was wrong with the response?" : "Describe the problem or your idea. What did you expect to happen?"}" data-noenter autofocus></textarea></label>
        ${ai ? `<label class="f"><span class="lh">The AI response <span class="hint">sent with your report; remove anything private</span></span><textarea name="steps" rows="5" maxlength="1500" data-noenter>${esc(ai.text)}</textarea></label>`
          : `<label class="f"><span class="lh">Steps to make it happen <span class="hint">optional</span></span><textarea name="steps" rows="3" maxlength="1500" placeholder="1. Go to… 2. Tap… 3. See…" data-noenter></textarea></label>`}
        <div class="bug-shot">
          <label class="btn small" style="cursor:pointer">Attach a Screenshot<input type="file" id="bugFile" accept="image/*" class="sr"></label>
          <span class="mini" id="bugShotNote">Optional. It may show your tasks or notes, so only add one you're happy to share.</span>
          <div id="bugShotPrev"></div>
        </div>
        <label class="mi-check"><input type="checkbox" name="contact" id="bugContact"> You can email me about this</label>
        <label class="f" id="bugMailRow" style="display:none">Your email<input type="email" name="email" id="bugMail" maxlength="200" value="${esc(email)}" placeholder="you@example.com" autocomplete="email" data-noenter></label>
        <details class="bug-diag"><summary>What gets sent with it</summary><p class="mini" style="margin:6px 0">Only this technical info, plus a random ID from this device so reports can be grouped and rate-limited. Never your tasks, notes or files:</p><pre class="mini" id="bugDiag" style="white-space:pre-wrap;word-break:break-word;max-height:160px;overflow:auto;margin:0"></pre></details>
        <p class="mini" id="bugMsgOut" role="status" style="margin:0"></p>
      </div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span><button type="button" class="btn primary" data-submit>Send Report</button></div>
    </form>`, () => { submit(); return false; });
    const diag = diagnostics();
    if (ai) diag.ai = ai.feature || "unknown";
    dlg.querySelector("form.bug-sheet").dataset.ai = ai ? diag.ai : "";
    $("#bugDiag").textContent = Object.entries(diag).filter(([k]) => k !== "errors" && k !== "ua").map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join("\n") + `\nrecent errors: ${diag.errors.length ? diag.errors.map(e => e.m).join(" | ") : "none"}\nbrowser: ${diag.ua || ""}`;
    const contact = $("#bugContact");
    contact.addEventListener("change", () => { $("#bugMailRow").style.display = contact.checked ? "" : "none"; if (contact.checked) $("#bugMail").focus(); });
    $("#bugFile").addEventListener("change", async e => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      const note = $("#bugShotNote");
      note.textContent = "Preparing the picture…";
      try {
        shot = await shrink(f);
        $("#bugShotPrev").innerHTML = `<div style="display:flex;align-items:center;gap:10px;margin-top:6px"><img src="${shot}" alt="Screenshot preview" style="max-width:120px;max-height:90px;border-radius:8px;border:1px solid var(--line)"><button type="button" class="btn small" id="bugShotX">Remove</button></div>`;
        $("#bugShotX").addEventListener("click", () => { shot = ""; $("#bugShotPrev").innerHTML = ""; note.textContent = "Screenshot removed."; $("#bugFile").value = ""; });
        note.textContent = "Screenshot attached.";
      } catch (err) { shot = ""; $("#bugShotPrev").innerHTML = ""; note.textContent = "Couldn't use that picture. Try a smaller image."; }
      e.target.value = "";
    });
  }

  async function submit(){
    if (busy) return;
    const f = dlg.querySelector("form.bug-sheet"); if (!f) return;
    const out = $("#bugMsgOut"), say = m => { if (out) out.textContent = m; };
    const msg = String(f.msg.value || "").trim();
    if (msg.length < 5) { say("Please describe what happened (a few words is enough)."); f.msg.focus(); return; }
    const wantMail = f.contact.checked, mail = String(f.email.value || "").trim();
    if (wantMail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { say("That email address doesn't look right. Fix it, or untick the email box."); f.email.focus(); return; }
    let last = 0; try { last = Number(localStorage.getItem(LASTSEND)) || 0; } catch (e) {}
    if (Date.now() - last < 15000) { say("One moment, you just sent a report. Try again in a few seconds."); return; }
    const row = {category: f.cat.value, message: msg, steps: String(f.steps.value || "").trim() || null, contact_email: wantMail ? mail.slice(0, 200) : null,
      diagnostics: Object.assign(diagnostics(), f.dataset.ai ? {ai: f.dataset.ai} : {}), screenshot: shot || null, client_id: clientId(), client_ref: uid()};
    busy = true;
    const btn = f.querySelector("[data-submit]"); btn.disabled = true; btn.textContent = "Sending…"; say("");
    const res = await post(row);
    busy = false;
    if (res === "sent") { try { localStorage.setItem(LASTSEND, String(Date.now())); } catch (e) {} if (dlg.open) dlg.close(); toast("Thank you! Your report was sent."); return; }
    if (res === "offline" || !server()) {
      const q = readQ(); q.push(row);
      if (writeQ(q)) { try { localStorage.setItem(LASTSEND, String(Date.now())); } catch (e) {} if (dlg.open) dlg.close(); toast("You're offline. Your report is saved and will be sent when you're back online."); }
      else { btn.disabled = false; btn.textContent = "Send Report"; say("Couldn't save your report on this device. Check your connection and try again."); }
      return;
    }
    btn.disabled = false; btn.textContent = "Send Report";
    say(res === "missing" ? srvSetup("Sending reports", "supabase-bug-reports.sql")
      : res === "limited" ? "You've sent quite a few reports lately. Please try again in an hour."
      : "That report couldn't be sent. If it has a screenshot, try again without it.");
  }

  function reportAI(text, feature){ open({cat: "ai", ai: {text, feature}}); }
  document.addEventListener("click", e => {
    const b = e.target && e.target.closest ? e.target.closest("[data-ai-report]") : null;
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const d = b.closest("dialog"); if (d && d !== dlg && d.open) d.close();
    const go = () => reportAI(b.dataset.aiText || "", b.dataset.aiReport || "");
    if (dlg.open) { dlg.close(); setTimeout(go, 40); } else go();
  }, true);

  window.SBFEEDBACK = {open, flush, diagnostics, reportAI, pending: () => readQ().length};
  hook("menu", () => `<button data-act="bug-open" data-group="app"><span>Report a Bug or Send Feedback<span class="sub">Something broken, confusing or missing? Tell us, with an optional screenshot${readQ().length ? ` (${readQ().length} waiting to send)` : ""}</span></span></button>`);
  hook("act", act => {
    if (act !== "bug-open") return false;
    if (dlg.open) dlg.close();
    setTimeout(open, 40);
    return true;
  });
})();


