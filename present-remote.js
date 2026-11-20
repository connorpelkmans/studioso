/* The phone remote for presentation practice (99-present.js). The laptop shows a QR code for present-remote.html#<code>. The code
   names an encrypted live channel: both sides derive the channel's name and an AES-GCM key from it, so only someone holding the code
   can read or send on it, and the code never leaves this page (it's after the #, so it isn't sent to any server).
     laptop -> phone  "s": the clock, the slide, your notes, the next slide, pace and speaker
     phone -> laptop  "c": {cmd: "next" | "prev" | "pp" | "vplay" | "vskip" | "hello"} */
(function(){
  "use strict";
  var $ = function(id){ return document.getElementById(id); };
  var code = String(location.hash || "").slice(1), key = null, ch = null, last = 0, lastBuzz = "";
  function fmt(ms){ var s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function say(t){ $("msg").hidden = false; $("ui").hidden = true; $("msg").textContent = t; }
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(code)) { say("Open this page by scanning the QR code in Studyboard's presentation practice."); return; }
  if (!window.crypto || !crypto.subtle || !window.supabase) { say("This browser can't open a secure link. Try your phone's main browser."); return; }
  var te = new TextEncoder();
  function b64u(u8){ return btoa(String.fromCharCode.apply(null, Array.from(u8))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function unb64u(s){ return Uint8Array.from(atob(String(s).replace(/-/g, "+").replace(/_/g, "/")), function(c){ return c.charCodeAt(0); }); }
  function hex(b){ return Array.from(new Uint8Array(b)).map(function(x){ return x.toString(16).padStart(2, "0"); }).join(""); }
  function seal(obj){ var iv = crypto.getRandomValues(new Uint8Array(12)); return crypto.subtle.encrypt({name: "AES-GCM", iv: iv}, key, te.encode(JSON.stringify(obj))).then(function(ct){ return {iv: b64u(iv), ct: b64u(new Uint8Array(ct))}; }); }
  function unseal(m){ return crypto.subtle.decrypt({name: "AES-GCM", iv: unb64u(m.iv)}, key, unb64u(m.ct)).then(function(pt){ return JSON.parse(new TextDecoder().decode(pt)); }).catch(function(){ return null; }); }
  function send(cmd){ if (!ch) return; seal({cmd: cmd}).then(function(p){ ch.send({type: "broadcast", event: "c", payload: p}); }); }
  function buzz(p){ try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  var wl = null; function wake(){ try { if (navigator.wakeLock && !wl) navigator.wakeLock.request("screen").then(function(l){ wl = l; l.addEventListener("release", function(){ wl = null; }); }).catch(function(){}); } catch (e) {} }
  // play and pause: a round button with a pause sign or a play sign, so it never looks like Back
  var PP = {pause: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4.2" height="14" rx="1.4"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.4"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M8.5 5.6v12.8a1 1 0 0 0 1.5.86l10-6.4a1 1 0 0 0 0-1.72l-10-6.4a1 1 0 0 0-1.5.86z"/></svg>'}, ppWas = null;
  function ppIcon(run){
    if (ppWas === run) return; ppWas = run;
    var b = $("pp"); b.innerHTML = "<i>" + (run ? PP.pause : PP.play) + "</i>"; b.classList.toggle("paused", !run); b.setAttribute("aria-label", run ? "Pause" : "Resume");
  }
  ppIcon(true);
  // the clock keeps counting between the laptop's updates (about one a second), from the latest time it sent
  var base = null;
  function clockNow(){ return base ? base.el + (base.run ? performance.now() - base.at : 0) : 0; }
  function slideNow(){ return base ? base.st + (base.run ? performance.now() - base.at : 0) : 0; }
  function paintClock(){
    if (!base) return;
    $("clock").textContent = fmt(clockNow());
    if (!base.qa && base.sb != null) {
      var st = slideNow(), r = base.sb ? st / base.sb : 0, b = $("bar");
      $("st").textContent = fmt(st) + " of " + fmt(base.sb);
      b.style.width = Math.min(100, r * 100) + "%"; b.className = r > 1.5 ? "over" : r > 1 ? "warn" : "";
      document.body.classList.toggle("long", base.go && r > 1 && r <= 1.5); document.body.classList.toggle("vlong", base.go && r > 1.5);
    }
  }
  setInterval(paintClock, 200);
  function show(s){
    last = Date.now(); $("dot").classList.add("on");
    if (s.done) { say("That run is over. Your results are on the laptop."); return; }
    if (s.n == null) return;
    $("msg").hidden = true; $("ui").hidden = false;
    $("name").textContent = s.name || "Presentation";
    $("cnt").hidden = false; $("cnt").textContent = s.qa ? "Q&A" : (s.i + 1) + " / " + s.n + (s.kn ? " · click " + (s.k || 0) + "/" + s.kn : "");
    base = {el: Number(s.el) || 0, st: Number(s.st) || 0, sb: s.sb, at: performance.now(), run: !!(s.run && s.go && !s.qa), go: !!s.go, qa: !!s.qa};
    $("tgt").textContent = "of " + fmt(s.tg);
    var pc = $("pace"); pc.hidden = !s.go || !s.pace; pc.className = "chip " + (s.pc || ""); pc.textContent = s.pace || "";
    var sp = $("sp"); sp.hidden = !s.sp || !!s.qa; if (s.sp) { sp.style.setProperty("--spc", s.spc || "#fff"); sp.lastChild.textContent = s.sp; }
    if (s.qa) { $("title").textContent = "Question"; $("st").textContent = ""; $("notes").textContent = s.qa; $("notes").classList.add("qa"); $("next").textContent = ""; $("nextb").textContent = "Next ▶"; }
    else {
      $("notes").classList.remove("qa");
      $("title").textContent = s.t || "";
      $("notes").textContent = s.nt || "";
      $("next").innerHTML = ""; var lb = document.createTextNode("Next: "), nb = document.createElement("b"); nb.textContent = s.nx || ""; $("next").appendChild(lb); $("next").appendChild(nb);
      $("nextb").textContent = !s.go ? "Start ▶" : s.kn && (s.k || 0) < s.kn ? "Click ▶" : "Next ▶";
    }
    // a video on this slide: play it on the laptop, or skip it (its length still counts)
    var vr = $("vrow"), has = !s.qa && s.vd != null && s.vs !== "done";
    vr.hidden = !has && !(s.vs === "done" && !s.qa);
    if (s.vs === "done") { $("vtxt").textContent = "✓ Video counted"; $("vplay").hidden = true; $("vskip").hidden = true; }
    else if (has) {
      $("vtxt").textContent = s.vs === "play" ? "Video playing" : "Video" + (s.vd ? " · " + fmt(s.vd) : "");
      $("vplay").hidden = !s.vp || s.vs === "play"; $("vskip").hidden = !s.go || (!s.vd && s.vs !== "play");
      $("vskip").textContent = s.vs === "play" ? "Skip the Rest" : "Skip" + (s.vd ? " · adds " + fmt(s.vd) : "");
    }
    paintClock();
    ppIcon(!!s.run);
    if (s.buzz && s.buzz !== lastBuzz) buzz(s.buzz === "vlong" ? [120, 80, 120] : s.buzz === "wrap" ? [60, 60, 60, 60, 60] : [90]);
    lastBuzz = s.buzz || "";
  }
  $("nextb").addEventListener("click", function(){ send("next"); wake(); });
  $("prev").addEventListener("click", function(){ send("prev"); });
  $("pp").addEventListener("click", function(){ send("pp"); });
  $("vplay").addEventListener("click", function(){ send("vplay"); });
  $("vskip").addEventListener("click", function(){ send("vskip"); });
  setInterval(function(){ if (last && Date.now() - last > 6000) { $("dot").classList.remove("on"); } }, 2000);
  Promise.all([crypto.subtle.digest("SHA-256", te.encode("sb-pres-id:" + code)), crypto.subtle.digest("SHA-256", te.encode("sb-pres-key:" + code))]).then(function(h){
    return crypto.subtle.importKey("raw", h[1], "AES-GCM", false, ["encrypt", "decrypt"]).then(function(k){
      key = k;
      var cfg = window.STUDYBOARD_SITE || {};
      var cli = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "sb-present-remote"}});
      ch = cli.channel("sbpres-" + hex(h[0]).slice(0, 40), {config: {broadcast: {self: false, ack: false}}});
      ch.on("broadcast", {event: "s"}, function(m){ unseal((m && m.payload) || {}).then(function(s){ if (s) show(s); }); });
      ch.subscribe(function(st){
        if (st === "SUBSCRIBED") { say("Connected. Waiting for your laptop…"); send("hello"); wake(); }
        else if (st === "CHANNEL_ERROR" || st === "TIMED_OUT") say("Couldn't connect. Check your connection, then scan the code again.");
      });
    });
  }).catch(function(){ say("Couldn't connect. Scan the code again."); });
})();
