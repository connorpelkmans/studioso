/* ===== module: 01-passkeys.js: signing in with a passkey (Face ID, a fingerprint or a security key) on the website ===== */
// Passkeys belong to studyboardapp.com (Supabase: Authentication, Passkeys, Relying Party ID), so they work only on that
// website. The desktop app (app://) and the phone apps (capacitor://) keep email, Google, Apple and Microsoft.
// Three ways in:
//   1. the email field on the sign-in sheet offers saved passkeys by itself (autocomplete="username webauthn")
//   2. a "Sign In With a Passkey" link under the password, for browsers that don't offer it in the field
//   3. after an email and password sign-in, a one-time offer to save one; Settings has Passkeys to add or remove them
const SBPK = window.SBPK = (() => {
  const RP = "studyboardapp.com";
  const ASKED = "studyboard:pk:asked:";
  let ctl = null;
  const host = () => { try { return location.hostname || ""; } catch (e) { return ""; } };
  const onSite = () => { const h = host(); return h === RP || h.endsWith("." + RP); };
  const native = () => !!(window.StudyboardNative || (typeof DESK !== "undefined" && DESK));
  // the browser can do passkeys, this is the website, and accounts are Studyboard's own (not a self-hosted server)
  const can = () => {
    try {
      return !!(window.PublicKeyCredential && navigator.credentials && window.isSecureContext && onSite() && !native()
        && typeof sb !== "undefined" && sb && sb.auth && typeof sb.auth.signInWithPasskey === "function" && !sbCustom());
    } catch (e) { return false; }
  };
  const quiet = e => { const s = String((e && (e.name || "")) + " " + (e && (e.message || "")) + " " + (e && e.code || "")); return /NotAllowed|Abort|cancel|timed out|ERROR_CEREMONY_ABORTED/i.test(s); };
  const words = e => {
    const s = String(e && (e.message || e) || "");
    if (quiet(e)) return "Passkey sign-in was cancelled. Try again, or use your email and password.";
    if (/not.?enabled|disabled|404|not found/i.test(s)) return "Passkey sign-in isn't available right now. Use your email and password.";
    if (/credential|passkey/i.test(s) && /not|unknown|invalid/i.test(s)) return "That passkey isn't linked to a Studyboard account. Use your email and password, then save a new passkey.";
    return typeof sbWords === "function" ? sbWords(e) : "That didn't work. Try again.";
  };
  const stop = () => { if (ctl) { try { ctl.abort(); } catch (e) {} ctl = null; } };

  // 1. The email field offers a saved passkey (the browser's own suggestion; nothing shows when there's none)
  async function autofill(onIn){
    stop();
    if (!can()) return;
    try { if (!PublicKeyCredential.isConditionalMediationAvailable || !(await PublicKeyCredential.isConditionalMediationAvailable())) return; } catch (e) { return; }
    const form = dlg.querySelector("form.sb-acct[data-mode=signin]"); if (!form) return;
    const c = ctl = new AbortController();
    // closing or replacing the sheet ends the offer
    const end = () => { if (ctl === c) stop(); };
    dlg.addEventListener("close", end, {once: true});
    const watch = setInterval(() => { if (!form.isConnected) { clearInterval(watch); end(); } }, 800);
    try {
      const {data, error} = await sb.auth.signInWithPasskey({options: {mediation: "conditional", signal: c.signal}});
      clearInterval(watch);
      if (c.signal.aborted) return;
      if (error) { if (!quiet(error)) onIn(null, words(error)); return; }
      if (data) onIn(data);
    } catch (e) { clearInterval(watch); if (!c.signal.aborted && !quiet(e)) onIn(null, words(e)); }
    finally { if (ctl === c) ctl = null; }
  }
  // 2. The link: the browser's passkey sheet
  async function signIn(){
    stop();
    const {data, error} = await sb.auth.signInWithPasskey();
    if (error) throw error;
    return data;
  }

  // 3. After a password sign-in: offer once per account, when nothing else is on screen
  const askedKey = () => ASKED + ((typeof sbUser !== "undefined" && sbUser && sbUser.id) || "");
  const asked = () => { try { return !!localStorage.getItem(askedKey()); } catch (e) { return true; } };
  const markAsked = () => { try { localStorage.setItem(askedKey(), String(Date.now())); } catch (e) {} };
  async function list(){
    const {data, error} = await sb.auth.passkey.list();
    if (error) throw error;
    const a = Array.isArray(data) ? data : (data && (data.passkeys || data.items)) || [];
    return a.filter(Boolean);
  }
  async function platformOk(){ try { return !!(await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); } catch (e) { return false; } }
  function offerLater(){
    if (!can()) return;
    let tries = 0;
    const tick = async () => {
      if (!sbUser || asked() || ++tries > 90) return;
      // wait for the sign-in sheet, the welcome setup and anything else to finish
      if (dlg.open || (window.SBOB && SBOB.pending && SBOB.pending()) || document.hidden) { setTimeout(tick, 2000); return; }
      if (!(await platformOk())) return;
      let have = []; try { have = await list(); } catch (e) { return; }
      if (have.length) { markAsked(); return; }
      if (dlg.open || !sbUser || asked()) { setTimeout(tick, 2000); return; }
      markAsked();
      offerSheet();
    };
    setTimeout(tick, 1500);
  }
  const KEY_IC = `<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="9" r="4"/><path d="M11 12l9 9M17 18l2-2M15 16l2-2"/></svg>`;
  function offerSheet(){
    openSheet(`<div class="sheet sb-pk">${head("Sign In Faster Next Time")}
      <div class="sheet-body">
        <div class="sb-pk-ic">${KEY_IC}</div>
        <p style="margin:0">Save a passkey and sign in with Face ID, your fingerprint or your device's PIN. No password to type.</p>
        <p class="mini" style="margin:0">It's saved by your device or password manager, never sent to Studyboard. Your password keeps working too.</p>
        <p class="status-msg" id="pkMsg" style="margin:0" aria-live="polite"></p>
      </div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="close">Not Now</button><span class="spacer"></span><button type="button" class="btn primary" id="pkSave">Save a Passkey</button></div></div>`);
    const b = $("#pkSave");
    if (b) b.addEventListener("click", async () => {
      b.disabled = true; const m = $("#pkMsg"); if (m) m.textContent = "Follow your device's prompt…";
      const ok = await add(t => { if (m) m.textContent = t; });
      b.disabled = false;
      if (ok) { if (dlg.open) dlg.close(); toast("Passkey saved. Next time, tap the email field and pick it."); }
    });
  }
  // say: shows a problem; true when one was saved
  async function add(say){
    try {
      const {error} = await sb.auth.registerPasskey();
      if (error) throw error;
      return true;
    } catch (e) {
      const s = String(e && (e.message || e) || "");
      say(quiet(e) ? "No passkey was saved." : /exclude|already|InvalidState/i.test(s + (e && e.name)) ? "This device already has a passkey for your account." : words(e));
      return false;
    }
  }

  /* Settings: Passkeys */
  const when = v => { const t = Date.parse(v || ""); return t ? new Date(t).toLocaleDateString(undefined, {month: "short", day: "numeric", year: "numeric"}) : ""; };
  async function manageSheet(note){
    openSheet(`<div class="sheet sb-pk">${head("Passkeys")}<div class="sheet-body"><p class="mini" style="margin:0">Loading…</p></div></div>`);
    let have = [], err = "";
    try { have = await list(); } catch (e) { err = words(e); }
    if (!dlg.querySelector(".sb-pk")) return;
    const rows = have.map(p => `<li><span class="sb-pk-name"><b>${esc(p.friendly_name || p.name || "Passkey")}</b><span class="mini">${[p.created_at ? "Added " + when(p.created_at) : "", p.last_used_at ? "last used " + when(p.last_used_at) : ""].filter(Boolean).join(", ")}</span></span><button type="button" class="btn small" data-pk-del="${esc(p.id)}">Remove</button></li>`).join("");
    openSheet(`<div class="sheet sb-pk">${head("Passkeys")}
      <div class="sheet-body">
        <p style="margin:0">Sign in with Face ID, your fingerprint or your device's PIN instead of a password. Passkeys work on studyboardapp.com.</p>
        ${err ? `<p class="status-msg" style="margin:0">${esc(err)}</p>` : have.length ? `<ul class="sb-pk-list" aria-label="Your passkeys">${rows}</ul>` : `<p class="mini" style="margin:0">You haven't saved a passkey yet.</p>`}
        <p class="status-msg" id="pkMsg" style="margin:0" aria-live="polite">${esc(note || "")}</p>
      </div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="close">Done</button><span class="spacer"></span><button type="button" class="btn primary" id="pkAdd">Add a Passkey</button></div></div>`);
    const m = $("#pkMsg"), say = t => { if (m) m.textContent = t; };
    const a = $("#pkAdd");
    if (a) a.addEventListener("click", async () => { a.disabled = true; say("Follow your device's prompt…"); const ok = await add(say); a.disabled = false; if (ok) manageSheet("Passkey saved."); });
    dlg.querySelectorAll("[data-pk-del]").forEach(b => b.addEventListener("click", async () => {
      if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "Remove?"; b.classList.add("danger"); return; }
      b.disabled = true;
      try { const {error} = await sb.auth.passkey.delete({passkeyId: b.dataset.pkDel}); if (error) throw error; manageSheet("Passkey removed. Also delete it from your device or password manager."); }
      catch (e) { b.disabled = false; say(words(e)); }
    }));
  }
  hook("menu", () => can() && sbUser ? `<button data-act="pk-manage" data-group="account"><span>Passkeys<span class="sub">Sign in with Face ID or your fingerprint</span></span></button>` : "");
  hook("act", act => { if (act === "pk-manage") { manageSheet(); return true; } return false; });

  return {can, autofill, signIn, offerLater, manageSheet, stop, words};
})();
