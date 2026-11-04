/* ===== module: 01-phone-cam.js: photos from your phone on a computer (a QR code and the photo relay), for Scan to PDF and Photo to Note ===== */
/* On a computer, Take Photos shows a QR code. It opens a camera page on the phone (cloudflare/key-relay/src/scan.js), and the photos
   taken there come in here, locked (AES-GCM) with a key that only the QR code carries, through the relay. The relay never sees the code.
   PHONE_CAM.start(o) begins a session: o.onPhoto(file) gets each photo, o.onChange() redraws the panel, o.alive() says the sheet is
   still open (once it isn't, the session ends), o.kind "notes" words the phone's page for Photo to Note. PHONE_CAM.panel(ph, attr)
   draws the QR panel; its buttons carry attr="phone-again" or "phone-stop" for the sheet to handle. */
const PHONE_CAM = (() => {
  const RELAY = () => (typeof KEY_RELAY === "string" && /^https:\/\//.test(KEY_RELAY) ? KEY_RELAY.replace(/\/+$/, "") : "");
  // only on a computer: a phone or tablet takes the photos itself
  function can(){
    if (!RELAY() || !window.crypto || !crypto.subtle || typeof QR === "undefined") return false;
    const ua = navigator.userAgent || "";
    return !(/Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) || (navigator.userAgentData && navigator.userAgentData.mobile));
  }
  const b64u = b => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const hexOf = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
  const on = ph => ph.live && !ph.stopped && (!ph.o.alive || ph.o.alive());
  function start(o){
    const ph = {o: o || {}, got: 0, err: "", busy: false, live: false, stopped: false, url: ""};
    (async () => {
      const code = b64u(crypto.getRandomValues(new Uint8Array(16))), te = new TextEncoder();
      const [idH, kH] = await Promise.all([crypto.subtle.digest("SHA-256", te.encode("sb-scan-id:" + code)), crypto.subtle.digest("SHA-256", te.encode("sb-scan-key:" + code))]);
      ph.id = hexOf(idH); ph.key = await crypto.subtle.importKey("raw", kH, "AES-GCM", false, ["decrypt"]);
      ph.url = RELAY() + "/s" + (ph.o.kind === "notes" ? "?for=notes" : "") + "#" + code;
      if (ph.stopped) return;
      draw(ph);
      try {
        const r = await fetch(`${RELAY()}/v1/s/${ph.id}`, {method: "POST"});
        if (r.status !== 201) throw new Error(r.status === 429 ? "busy" : "relay");
      } catch (e) { if (!ph.stopped) { ph.err = e.message === "busy" ? "Too many tries just now. Wait a minute and try again." : "Couldn't connect to your phone. Check your connection and try again."; draw(ph); } return; }
      if (ph.stopped) { end(ph); return; }
      ph.live = true; draw(ph); poll(ph);
    })();
    return ph;
  }
  const draw = ph => { if (!ph.stopped && ph.o.onChange) { try { ph.o.onChange(); } catch (e) {} } };
  async function poll(ph){
    if (!ph.live || ph.stopped) return;
    if (ph.o.alive && !ph.o.alive()) { stop(ph); return; }   // the sheet was closed or set aside
    if (!ph.busy) {
      ph.busy = true;
      try {
        const r = await fetch(`${RELAY()}/v1/s/${ph.id}/p`, {cache: "no-store"});
        if (r.status === 404) { ph.live = false; ph.err = "The code ran out. Click Take Photos to get a new one."; draw(ph); return; }
        const {ks} = await r.json();
        for (const k of ks || []) {
          if (!on(ph)) return;
          const g = await fetch(`${RELAY()}/v1/s/${ph.id}/p/${k}`, {cache: "no-store"}); if (!g.ok) continue;
          const box = new Uint8Array(await g.arrayBuffer());
          let raw; try { raw = await crypto.subtle.decrypt({name: "AES-GCM", iv: box.slice(0, 12)}, ph.key, box.slice(12)); } catch (e) { continue; }
          ph.got++;
          await ph.o.onPhoto(new File([raw], `Phone photo ${ph.got}.jpg`, {type: "image/jpeg"})); draw(ph);
        }
      } catch (e) {} finally { ph.busy = false; }
    }
    setTimeout(() => poll(ph), 1500);
  }
  const end = ph => { if (ph.id) fetch(`${RELAY()}/v1/s/${ph.id}`, {method: "DELETE", keepalive: true}).catch(() => {}); };
  // ends the session: the relay deletes anything still waiting, and the phone's page says the code ran out
  function stop(ph){
    if (!ph || ph.stopped) return;
    ph.stopped = true; ph.live = false; end(ph);
  }
  function panel(ph, attr, what){
    if (!ph || !ph.url && !ph.err) return "";
    return `<div class="phone-qr pde-phone"${ph.err ? "" : ` data-link="${esc(ph.url)}"`}>${ph.err ? "" : QR.svg(ph.url, "QR code to open the camera page on your phone")}<div class="phone-qr-t">
      <b>${ph.err ? "Phone Not Connected" : "Scan This With Your Phone's Camera"}</b>
      <p class="mini">${ph.err ? esc(ph.err) : `It opens a page on your phone. ${what || "Take a photo of each page there and it shows up here."} Photos are locked (encrypted) on your phone, and deleted from the relay as soon as this computer has them.`}</p>
      ${ph.err ? "" : `<p class="mini phone-qr-n" aria-live="polite">${!ph.live ? "Connecting…" : ph.got ? `${ph.got} photo${ph.got === 1 ? "" : "s"} from your phone` : "Waiting for photos…"}</p>`}
      <div class="row-actions">${ph.err ? `<button type="button" class="btn small" ${attr}="phone-again">Try Again</button>` : ""}<button type="button" class="btn small" ${attr}="phone-stop">${ph.err ? "Close" : "Done With Phone"}</button></div></div></div>`;
  }
  return {can, start, stop, panel};
})();
