/* ===== module: 99-whiteboard-pro.js ===== */
/* Whiteboard pictures (Studyboard Pro): add photos and diagrams to a board (the Picture tool, paste, or drag them in), move and resize them with
   Select, and draw and write around them. "Draw in Marker" redraws a picture as if it were sketched on the board with dry-erase markers:
   with a Gemini key it asks Gemini's image model; without one (or if that fails) a sketch filter on this device traces its outlines in marker.
   Either way the white background becomes see-through, so the drawing sits on the board like the rest of the ink.
   A picture is a file (Files > Lecture Notes, like note photos, so it syncs and backs up with your account); the board keeps
   {id, k: "i", x, y, w, h, f: file id, r: 1 once redrawn}. Pictures already on a board stay visible on a free plan. */
(() => {
  const W = window.SBWB, P = window.SBPRO; if (!W || !P) return;
  const MAX = 16, SIDE = 1600;
  const locked = () => P.locked();
  const WHY = "Pictures on the whiteboard are part of Studyboard Pro: add photos and diagrams, move and resize them, write around them, and have AI redraw them in marker.";
  const upsell = () => { if (typeof PLAN !== "undefined" && PLAN) PLAN.openSheet(WHY); };
  const IO = {upload: (l, o) => uploadFiles(l, o), bytes: id => assetBytes(id), ai: null};   // storage and AI calls (a test swaps them)
  const SV = p => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const PIC = SV('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16l-5-5-8.5 8.5"/>');

  /* ---------- Showing pictures ---------- */
  const URLS = new Map(), FAIL = new Map();   // asset id -> object URL ("" while loading, "!" when it couldn't be loaded)
  const fileOf = it => { const f = it && it.f && state.files[it.f]; return f && f.revs && f.revs.length ? f : null; };
  function urlOf(it){
    if (it.src) return it.src;
    const f = fileOf(it); if (!f) return null;
    const r = curRev(f); let u = URLS.get(r.assetId);
    if (u === "!" && Date.now() - (FAIL.get(r.assetId) || 0) > 20000) { URLS.delete(r.assetId); u = undefined; }   // tried again a little later (signed in since, or back online)
    if (u === undefined) load(r.assetId, r.type);
    return u && u !== "!" ? u : null;
  }
  // Right after a reload, sign-in may still be coming back: a failed load is tried again soon (0.6s, 1.2s, 2.4s...) and shows as loading
  // meanwhile; only after that is it "not available on this device".
  const TRIES = new Map();
  async function load(id, type){
    URLS.set(id, "");
    try { const b = await IO.bytes(id); URLS.set(id, URL.createObjectURL(new Blob([b], {type: type || "image/png"}))); TRIES.delete(id); }
    catch (e) {
      const n = (TRIES.get(id) || 0) + 1; TRIES.set(id, n);
      if (n <= 5) { setTimeout(() => { if (URLS.get(id) === "") { URLS.delete(id); W.refreshItems(); } }, 600 * 2 ** (n - 1)); return; }
      URLS.set(id, "!"); FAIL.set(id, Date.now()); TRIES.delete(id);
    }
    W.refreshItems();
  }
  const BUSY = new Set();
  hook("wb-items", ({host, list, xf}) => {
    if (!host) return;
    host.innerHTML = list.map(it => {
      const p = xf(it), u = urlOf(it), f = fileOf(it), bad = !u && f && URLS.get(curRev(f).assetId) === "!";
      return `<div class="wb-img${it.r ? " drawn" : ""}${it.fade ? " fade" : ""}${BUSY.has(it.id) ? " busy" : ""}" style="left:${+p.x}px;top:${+p.y}px;width:${+p.w}px;height:${+p.h}px">${u ? (it.er && it.er.length ? `<span class="wb-er" style="-webkit-mask-image:url('${erMask(it)}');mask-image:url('${erMask(it)}')">` : "") + (it.r && it.tint ? `<span class="wb-tint" style="background:${W.penHex(it.tint)};-webkit-mask-image:url('${esc(u)}');mask-image:url('${esc(u)}')"></span>` : `<img src="${esc(u)}" alt="" draggable="false">`) + (it.er && it.er.length ? "</span>" : "") : `<span class="wb-img-ph">${bad ? "Picture not available on this device" : (it.f && !f ? "Picture not here yet" : "Loading picture…")}</span>`}${BUSY.has(it.id) ? `<span class="wb-img-busy"><span class="spinner"></span>Drawing…</span>` : ""}</div>`;
    }).join("");
  });
  async function imageOf(it){
    let u = urlOf(it);
    if (!u) { const f = fileOf(it); if (!f) return null; const r = curRev(f); try { const b = await IO.bytes(r.assetId); u = URL.createObjectURL(new Blob([b], {type: r.type || "image/png"})); URLS.set(r.assetId, u); } catch (e) { return null; } }
    return new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = u; });
  }
  // all in one marker colour: the drawing's shape (its see-through background stays see-through), filled with the colour
  function tinted(im, color){
    const c = document.createElement("canvas"); c.width = im.naturalWidth || im.width; c.height = im.naturalHeight || im.height;
    const x = c.getContext("2d"); x.drawImage(im, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height); return c;
  }
    // Erased spots, as a mask: an SVG the size of the picture, see-through where the eraser went (circles, stretched back to round)
  const ERM = new Map();
  function erMask(it){
    const k = it.w + "x" + it.h + ":" + JSON.stringify(it.er); let u = ERM.get(k); if (u) return u;
    const ry = it.w / it.h;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="none"><defs><mask id="m"><rect width="1000" height="1000" fill="#fff"/>${it.er.map(c => `<ellipse cx="${+c[0]}" cy="${+c[1]}" rx="${+c[2]}" ry="${+(c[2] * ry).toFixed(1)}" fill="#000"/>`).join("")}</mask></defs><rect width="1000" height="1000" fill="#000" mask="url(#m)"/></svg>`;
    u = "data:image/svg+xml," + encodeURIComponent(svg);
    if (ERM.size > 200) ERM.clear(); ERM.set(k, u); return u;
  }
  function erased(src, it){
    const c = document.createElement("canvas"); c.width = src.naturalWidth || src.width; c.height = src.naturalHeight || src.height;
    const x = c.getContext("2d"); x.drawImage(src, 0, 0); x.globalCompositeOperation = "destination-out"; x.fillStyle = "#000";
    const sx = c.width / 1000, sy = c.height / 1000, ry = it.w / it.h;
    it.er.forEach(e => { x.beginPath(); x.ellipse(e[0] * sx, e[1] * sy, e[2] * sx, e[2] * ry * sy, 0, 0, Math.PI * 2); x.fill(); });
    return c;
  }
  function faded(src){
    const c = document.createElement("canvas"); c.width = src.naturalWidth || src.width; c.height = src.naturalHeight || src.height;
    const x = c.getContext("2d"); x.drawImage(src, 0, 0); x.globalCompositeOperation = "destination-in";
    [[c.width, 0], [0, c.height]].forEach(([gx, gy]) => { const g = x.createLinearGradient(0, 0, gx, gy); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.14, "#000"); g.addColorStop(0.86, "#000"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height); });
    return c;
  }
  hook("wb-paint-items", ({ctx, list, dark}) => Promise.all(list.map(async it => { const im = await imageOf(it); if (!im) return; try { let src = it.r && it.tint ? tinted(im, W.penHex(it.tint, !dark)) : im; if (it.er && it.er.length) src = erased(src, it); if (it.fade) src = faded(src); ctx.drawImage(src, it.x, it.y, it.w, it.h); } catch (e) {} })));

  /* ---------- Adding pictures ---------- */
  hook("wb-tools", () => `<button type="button" class="wb-tool wb-pic" data-wb="pic" aria-label="Add a Picture${locked() ? " (Studyboard Pro)" : ""}" title="Add a Picture${locked() ? " (Pro)" : ""}">${PIC}${locked() ? '<span class="wb-pro">PRO</span>' : ""}</button>`);
  const count = () => ((W.board() || {}).items || []).filter(it => it.k === "i").length;
  function shrink(file){
    return new Promise(res => {
      const u = URL.createObjectURL(file), im = new Image();
      im.onload = () => {
        const k = Math.min(1, SIDE / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.max(1, Math.round(im.naturalWidth * k)), h = Math.max(1, Math.round(im.naturalHeight * k));
        const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(im, 0, 0, w, h); URL.revokeObjectURL(u);
        c.toBlob(b => res(b ? {blob: b, w, h} : null), "image/webp", 0.86);
      };
      im.onerror = () => { URL.revokeObjectURL(u); res(null); };
      im.src = u;
    });
  }
  async function add(files, at){
    if (locked()) { upsell(); return; }
    const b = W.board(); if (!b) return;
    files = [...files].filter(f => /^image\//.test(f.type || "") || /\.(jpe?g|png|gif|webp|heic)$/i.test(f.name || ""));
    if (!files.length) { toast("Choose a picture (JPG, PNG, GIF or WebP)."); return; }
    const room = MAX - count(); if (room <= 0) { toast(`A board can hold ${MAX} pictures.`); return; }
    if (files.length > room) toast(`Only ${room} more picture${room === 1 ? "" : "s"} fit on this board.`);
    const n = state.notes[b.id], cam = W.cam(), st = W.stage().querySelector(".wb-frame"), fw = st.clientWidth, fh = st.clientHeight;
    const cx = at ? at[0] : (fw / 2 - cam.x) / cam.z, cy = at ? at[1] : (fh / 2 - cam.y) / cam.z;
    const ids = [];
    let k = 0;
    for (const file of files.slice(0, room)) {
      const s = await shrink(file); if (!s) { toast(`Couldn't read ${file.name || "that picture"}.`); continue; }
      const name = String(file.name || "Picture").replace(/\.[a-z0-9]+$/i, "") + ".webp";
      const made = await IO.upload([new File([s.blob], name, {type: "image/webp"})], {courseId: (n && n.courseId) || "", folderId: "notes"});
      if (!made || !made.length) continue;
      const f = made[0], r = curRev(f); if (r && r.assetId) URLS.set(r.assetId, URL.createObjectURL(s.blob));
      const vw = fw / cam.z, vh = fh / cam.z, w = Math.min(vw * 0.38, vh * 0.5 * s.w / s.h), h = w * s.h / s.w, id = uid();   // about a third of what you see, whatever the zoom
      W.set("i", id, {id, k: "i", x: Math.round(cx - w / 2 + k * 30), y: Math.round(cy - h / 2 + k * 30), w: Math.round(w), h: Math.round(h), f: f.id, at: Date.now()});
      ids.push("i" + id); k++;
    }
    if (ids.length) { W.setTool("select"); W.select(ids); }
  }
  function choose(){
    if (locked()) { upsell(); return; }
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.multiple = true; inp.className = "sr"; inp.tabIndex = -1;
    inp.addEventListener("change", () => { const fs = [...(inp.files || [])]; inp.remove(); if (fs.length) add(fs); });
    document.body.appendChild(inp); inp.click();
  }
  const onBoard = () => ui.tab === "notes" && W.on() && W.stage() && W.stage().isConnected;
  document.addEventListener("paste", e => {
    if (!onBoard() || (e.target && e.target.closest && e.target.closest("input,textarea,[contenteditable]"))) return;
    const fs = [...((e.clipboardData && e.clipboardData.files) || [])].filter(f => /^image\//.test(f.type));
    if (!fs.length) return; e.preventDefault(); add(fs);
  });
  document.addEventListener("dragover", e => { if (onBoard() && e.target.closest && e.target.closest(".wb-frame") && [...((e.dataTransfer && e.dataTransfer.types) || [])].includes("Files")) e.preventDefault(); });
  document.addEventListener("drop", e => {
    if (!onBoard() || !(e.target.closest && e.target.closest(".wb-frame"))) return;
    const fs = [...((e.dataTransfer && e.dataTransfer.files) || [])].filter(f => /^image\//.test(f.type)); if (!fs.length) return;
    e.preventDefault(); add(fs, W.toWorld(e.clientX, e.clientY));
  });

  /* ---------- Draw in Marker ---------- */
  // Fade Edges: the picture's edges soften into the board (on or off for every selected picture)
  const FADE = SV('<rect x="4" y="4" width="16" height="16" rx="3" stroke-dasharray="2.5 2.5"/><rect x="8" y="8" width="8" height="8" rx="1.5"/>');
  let selPics = [];
  hook("wb-selbar", ({bar, ids}) => {
    selPics = [...ids].filter(k => k[0] === "i").map(k => W.getI(k.slice(1))).filter(x => x && x.k === "i");
    if (!selPics.length) return;
    const on = selPics.every(x => x.fade), b = document.createElement("button"); b.type = "button"; b.dataset.wb = "fade";
    b.setAttribute("aria-pressed", String(on)); b.className = "wb-fade" + (on ? " on" : ""); b.title = "Soften the edges so it blends into the board";
    b.innerHTML = `${FADE}Fade Edges`;
    bar.insertBefore(b, bar.querySelector('[data-wb="restyle"]') || bar.querySelector('[data-wb="sel-copy"]'));
  });
  hook("wb-selbar", ({bar, it}) => {
    if (!it || it.k !== "i") return;
    const b = document.createElement("button"); b.type = "button"; b.dataset.wb = "restyle"; b.dataset.id = it.id;
    b.className = "wb-ai-btn";   // AI: the companion (or the AI sparkle) and the app's AI purple
    const st = styleOf(styleId());
    b.innerHTML = `${AI_ICON}${it.r ? "Draw Again" : esc(st[2])}${locked() ? " " + PRO_BADGE : ""}`;
    b.title = `Redraw this picture as if it were drawn on the board (${st[1]})`;
    // one button: it opens the style menu, and picking a style draws it
    if (!locked()) { b.dataset.wb = "restyle-menu"; b.setAttribute("aria-haspopup", "menu"); b.innerHTML = `${AI_ICON}${it.r ? "Draw Again" : "Draw"}<svg class="wb-chev" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`; b.title = "Pick a drawing style"; b.classList.add("wb-style-pick"); }
    bar.insertBefore(b, bar.querySelector('[data-wb="sel-copy"]'));
  });
  hook("wb-act", (a, el, id) => {
    if (a === "pic") choose(); else if (a === "restyle") restyle(id);
    else if (a === "restyle-menu") styleMenu(el, id);
    else if (a === "restyle-as") { const [iid, sid] = String(id).split("|"); closeStyleMenu(); try { localStorage.setItem(K_STYLE, sid); } catch (e) {} restyle(iid, sid); }
    else if (a === "fade" && selPics.length) { const on = !selPics.every(x => x.fade), ids = selPics.map(x => "i" + x.id); W.change(set => selPics.forEach(x => { const cur = W.getI(x.id); if (!cur) return; const o = Object.assign({}, cur); if (on) o.fade = 1; else delete o.fade; set("i", x.id, o); })); W.select(ids); }
  });

  const PROMPT = "Redraw this picture as a hand-drawn sketch on a clean white whiteboard, drawn only with dry-erase markers in black, blue, red, green, orange and purple. "
    + "Bold, confident marker outlines with slightly uneven pressure, simple marker hatching or flat marker fills for shading, a few highlights left white. "
    + "Keep the same subject, layout, proportions and any text or labels (rewritten in neat marker handwriting). "
    + "Pure white background filling the whole image: no board edges, no frame, no shadows, no photo texture, no markers or hands in the picture.";
  const MODELS = ["gemini-2.5-flash-image", "gemini-3-pro-image-preview", "gemini-2.5-flash-image-preview", "gemini-2.0-flash-preview-image-generation"];
  const toB64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1] || ""); r.onerror = rej; r.readAsDataURL(blob); });
  const canvasBlob = (c, type, q) => new Promise(res => c.toBlob(b => res(b), type || "image/png", q));
  // Gemini's picture model, with the same key the rest of the app uses (Settings > AI). Returns {img} or {why}: nokey, consent, badkey,
  // plan (the key can't use the picture model: billing off or its limit used up), noimage, offline.
  const STYLE_PROMPT = {
    outline: "Redraw this picture as a clean black marker outline drawing on a pure white background: confident even lines for the outlines and key details, no colour, no shading, no fill. Keep the same subject, layout and proportions. Pure white background filling the whole image: no frame, no shadows, no photo texture.",
    pencil: "Redraw this picture as a graphite pencil sketch on pure white paper: fine grey lines and light cross-hatching for the shadows, no colour. Keep the same subject, layout and proportions. Pure white background filling the whole image: no frame, no paper texture, no shadows.",
    bold: "Redraw this picture as a bold comic-book style drawing: thick black ink outlines and rich flat colours in a few tones, like it was coloured in with bright markers. Keep the same subject, layout and proportions. Pure white background filling the whole image: no frame, no shadows, no photo texture."};
  async function aiRedraw(im, sid){
    if (IO.ai) { const r = await IO.ai(im); return r ? {img: r} : {why: "noimage"}; }
    let key = ""; try { key = (aiCfg().keys || {}).gemini || ""; } catch (e) {}
    if (!key) return {why: "nokey"};
    try { if (!aiConsented("gemini") && !(await aiConsentAsk("gemini"))) return {why: "consent"}; } catch (e) {}
    const c = document.createElement("canvas"), k = Math.min(1, 1024 / Math.max(im.naturalWidth, im.naturalHeight));
    c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
    const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
    const data = await toB64(await canvasBlob(c, "image/jpeg", 0.9));
    let why = "noimage";
    for (const m of MODELS) {
      let res;
      try {
        res = await fetchT(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {method: "POST", headers: {"Content-Type": "application/json", "x-goog-api-key": key},
          body: JSON.stringify({contents: [{role: "user", parts: [{text: STYLE_PROMPT[sid] || PROMPT}, {inline_data: {mime_type: "image/jpeg", data}}]}], generationConfig: {responseModalities: ["TEXT", "IMAGE"]}})}, 120000);
      } catch (e) { why = "offline"; if (e && e.name === "AbortError") break; continue; }
      if (!res.ok) {
        let msg = ""; try { msg = JSON.stringify(await res.json()); } catch (e) {}
        if (/API key not valid|API_KEY_INVALID|PERMISSION_DENIED.*key/i.test(msg)) { why = "badkey"; break; }
        why = res.status === 429 || /quota|billing|RESOURCE_EXHAUSTED|FAILED_PRECONDITION|not (found|supported)|NOT_FOUND/i.test(msg) || res.status === 404 || res.status === 403 ? "plan" : why;
        continue;
      }
      try {
        const j = await res.json(), parts = (((j.candidates || [])[0] || {}).content || {}).parts || [];
        const p = parts.find(q => (q.inlineData || q.inline_data) && /^image\//.test((q.inlineData || q.inline_data).mimeType || (q.inlineData || q.inline_data).mime_type || ""));
        if (!p) { why = "noimage"; continue; }
        const d = p.inlineData || p.inline_data;
        const img = await new Promise(r => { const out = new Image(); out.onload = () => r(out); out.onerror = () => r(null); out.src = `data:${d.mimeType || d.mime_type};base64,${d.data}`; });
        if (img) return {img};
      } catch (e) { why = "noimage"; }
    }
    return {why};
  }
  const FELL = {
    nokey: "Traced in marker on this device. Add a Gemini key in Settings > AI for a full redraw.",
    consent: "Traced in marker on this device (the AI redraw needs your OK to send the picture to Google).",
    badkey: "Traced in marker on this device: Google says your Gemini key isn't valid. Check it in Settings > AI.",
    plan: "Traced in marker on this device: your Gemini key can't use Google's picture model right now. It needs billing turned on for the key in Google AI Studio, or its daily limit is used up.",
    noimage: "Traced in marker on this device: Gemini didn't send a drawing back for this picture. Try Draw Again.",
    offline: "Traced in marker on this device: couldn't reach Gemini. Check your connection and try Draw Again."
  };
  // The subject, as a soft mask (0 background .. 1 subject) at w x h, or null to draw the whole picture.
  // Safe by design, like a magic wand from the picture's edges: only background that touches the border, matches the border's colours
  // closely and changes smoothly (it stops at any outline) is left out. A plain wall, a sky or an out-of-focus backdrop goes; a head or an
  // arm can't be cut off across its outline. When it isn't clearly a subject on a background, the whole picture is drawn.
  function subjectMask(src, w, h){
    const S = 300, k = Math.min(1, S / Math.max(w, h)), mw = Math.max(16, Math.round(w * k)), mh = Math.max(16, Math.round(h * k)), M = mw * mh;
    const at = (X, Y) => (Math.min(h - 1, Math.round(Y / k)) * w + Math.min(w - 1, Math.round(X / k))) * 4;
    const R0 = new Float32Array(M), G0 = new Float32Array(M), B0 = new Float32Array(M);
    for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) { const j = at(x, y), i = y * mw + x; R0[i] = src[j]; G0[i] = src[j + 1]; B0[i] = src[j + 2]; }
    const boxb = (a, r) => { const t = new Float32Array(M), o = new Float32Array(M);
      for (let y = 0; y < mh; y++) { let s = 0, n = 0; for (let x = -r; x < mw + r; x++) { const ad = x + r, rm = x - r - 1; if (ad >= 0 && ad < mw) { s += a[y * mw + ad]; n++; } if (rm >= 0 && rm < mw) { s -= a[y * mw + rm]; n--; } if (x >= 0 && x < mw) t[y * mw + x] = s / n; } }
      for (let x = 0; x < mw; x++) { let s = 0, n = 0; for (let y = -r; y < mh + r; y++) { const ad = y + r, rm = y - r - 1; if (ad >= 0 && ad < mh) { s += t[ad * mw + x]; n++; } if (rm >= 0 && rm < mh) { s -= t[rm * mw + x]; n--; } if (y >= 0 && y < mh) o[y * mw + x] = s / n; } }
      return o; };
    const R = boxb(R0, 1), G = boxb(G0, 1), B = boxb(B0, 1);
    const cd = (i, j) => Math.sqrt((R[i] - R[j]) ** 2 + (G[i] - G[j]) ** 2 + (B[i] - B[j]) ** 2);
    // outlines: colour change across each spot
    const edge = new Float32Array(M);
    for (let y = 1; y < mh - 1; y++) for (let x = 1; x < mw - 1; x++) { const i = y * mw + x; edge[i] = Math.max(cd(i - 1, i + 1), cd(i - mw, i + mw)); }
    const ev = Array.from(edge).filter(v => v > 0).sort((p, q) => p - q), edgeT = Math.min(26, Math.max(12, ev[Math.floor(ev.length * 0.6)] || 12));   // stops at even a faint outline
    // the border's colours (a few groups); only groups that fill a fair share of the border count as background
    const bd = []; for (let x = 0; x < mw; x++) bd.push(x, (mh - 1) * mw + x); for (let y = 1; y < mh - 1; y++) bd.push(y * mw, y * mw + mw - 1);
    let cen = [0, 1, 2, 3, 4].map(q => { const i = bd[Math.floor((q + 0.5) / 5 * bd.length)]; return [R[i], G[i], B[i]]; });
    const near = (cs, i) => { let bi = 0, bv = 1e9; cs.forEach((c, q) => { const d = (c[0] - R[i]) ** 2 + (c[1] - G[i]) ** 2 + (c[2] - B[i]) ** 2; if (d < bv) { bv = d; bi = q; } }); return [bi, Math.sqrt(bv)]; };
    for (let it = 0; it < 8; it++) { const acc = cen.map(() => [0, 0, 0, 0]); for (const i of bd) { const a = acc[near(cen, i)[0]]; a[0] += R[i]; a[1] += G[i]; a[2] += B[i]; a[3]++; } cen = cen.map((c, q) => acc[q][3] ? [acc[q][0] / acc[q][3], acc[q][1] / acc[q][3], acc[q][2] / acc[q][3]] : c); }
    const cnt = cen.map(() => 0); for (const i of bd) cnt[near(cen, i)[0]]++;
    const bgc = cen.filter((c, q) => cnt[q] >= bd.length * 0.12); if (!bgc.length) return null;
    // the wand: from border spots that look like background, spread to neighbours with a small, smooth step that still look like it
    const bg = new Uint8Array(M), st = [], TB = 38, STEP = 10;
    for (const i of bd) if (!bg[i] && near(bgc, i)[1] < TB && edge[i] < edgeT) { bg[i] = 1; st.push(i); }
    while (st.length) { const j = st.pop(), y = (j / mw) | 0, x = j % mw;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= mw || Y >= mh) continue; const q = Y * mw + X;
        if (!bg[q] && edge[q] < edgeT && cd(j, q) < STEP && near(bgc, q)[1] < TB) { bg[q] = 1; st.push(q); } } }
    let m = new Uint8Array(M), area = 0; for (let i = 0; i < M; i++) { m[i] = bg[i] ? 0 : 1; area += m[i]; }
    // only when it's clearly a subject on a background (otherwise draw it all)
    if (area > M * 0.93 || area < M * 0.08) return null;
    const grow = (a, r, on) => { const b = boxb(Float32Array.from(a), r), o = new Uint8Array(M); for (let i = 0; i < M; i++) o[i] = on ? (b[i] > 0.01 ? 1 : 0) : (b[i] > 0.99 ? 1 : 0); return o; };
    m = grow(m, 1, true);   // a little extra around the subject, never less
    return {fill: up(m, 0.3), edge: up(grow(m, 3, true), 0.2)};
    function up(a8, lo){ const soft = boxb(boxb(Float32Array.from(a8), 1), 1), o = new Float32Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const X = Math.min(mw - 1, x * k), Yy = Math.min(mh - 1, y * k), x0 = X | 0, y0 = Yy | 0, x1 = Math.min(mw - 1, x0 + 1), y1 = Math.min(mh - 1, y0 + 1), fx = X - x0, fy = Yy - y0;
        const v = soft[y0 * mw + x0] * (1 - fx) * (1 - fy) + soft[y0 * mw + x1] * fx * (1 - fy) + soft[y1 * mw + x0] * (1 - fx) * fy + soft[y1 * mw + x1] * fx * fy; o[y * w + x] = Math.min(1, Math.max(0, (v - lo) / 0.4)); }
      return o; }
  }
  // Drawing styles: how the lines are found and coloured, and how the picture is coloured in
  const STYLES = [
    ["marker", "Marker", "Draw in Marker", {lines: [1.8, 2.1, 3.36], phi: 500, grow: 1, speck: 45, ink: "photo", fill: "marker"}],
    ["outline", "Outline", "Draw as Outline", {lines: [1.6, 1.9, 3.04], phi: 500, grow: 1, speck: 45, ink: "black", fill: "none"}],
    ["pencil", "Pencil", "Draw in Pencil", {lines: [1.0, 1.3, 2.08], phi: 160, grow: 0, speck: 20, ink: "graphite", fill: "shade"}],
    ["bold", "Bold Color", "Draw in Bold Color", {lines: [2.2, 2.6, 4.16], phi: 600, grow: 2, speck: 60, ink: "black", fill: "flat"}]];
  const K_STYLE = "studyboard:wbDrawStyle";
  const styleId = () => { let v = ""; try { v = localStorage.getItem(K_STYLE) || ""; } catch (e) {} return STYLES.some(x => x[0] === v) ? v : "marker"; };
  const styleOf = id => STYLES.find(x => x[0] === id) || STYLES[0];
  // The subject, found by Gemini (any key, free ones too): it outlines the main subject (segmentation masks) and the drawing is cut
  // out along that. Returns {w, h, a: Float32Array 0..1} at the picture's size, or null (no key, no OK to send it, or nothing usable),
  // and then the careful local cut-out is used.
  const SEG_MODELS = ["gemini-2.5-flash", "gemini-3.8-flash", "gemini-3.7-flash", "gemini-2.5-flash-lite"];
  const SEG_PROMPT = "Give the segmentation masks for the main subject or subjects of this photo: the person, people, animal or object it is a picture of, including all of their hair, clothes, hands and anything they hold. Not the background, ground, sky, plants or furniture behind them. Output a JSON list of segmentation masks where each entry contains the 2D bounding box in the key \"box_2d\", the segmentation mask in key \"mask\", and the text label in the key \"label\".";
  async function aiSubject(im){
    if (IO.seg) return IO.seg(im);
    let key = ""; try { key = (aiCfg().keys || {}).gemini || ""; } catch (e) {}
    if (!key) return null;
    try { if (!aiConsented("gemini") && !(await aiConsentAsk("gemini"))) return null; } catch (e) {}
    const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, k = Math.min(1, 1024 / Math.max(iw, ih));
    const c = document.createElement("canvas"); c.width = Math.round(iw * k); c.height = Math.round(ih * k);
    const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
    const data = await toB64(await canvasBlob(c, "image/jpeg", 0.88));
    for (const m of SEG_MODELS) {
      let res, txt = "";
      try {
        const gen = {responseMimeType: "application/json", temperature: 0.2}; if (m === "gemini-2.5-flash") gen.thinkingConfig = {thinkingBudget: 0};
        res = await fetchT(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {method: "POST", headers: {"Content-Type": "application/json", "x-goog-api-key": key},
          body: JSON.stringify({contents: [{role: "user", parts: [{inline_data: {mime_type: "image/jpeg", data}}, {text: SEG_PROMPT}]}], generationConfig: gen})}, 60000);
      } catch (e) { return null; }
      if (!res.ok) continue;
      try { const j = await res.json(); txt = ((((j.candidates || [])[0] || {}).content || {}).parts || []).map(p => p.text || "").join(""); } catch (e) { continue; }
      let list = null; try { list = JSON.parse(txt.replace(/^[^\[{]*/, "").replace(/[^\]}]*$/, "")); } catch (e) { list = null; }
      if (list && !Array.isArray(list)) list = list.masks || list.items || [list];
      if (!Array.isArray(list)) continue;
      const W0 = c.width, H0 = c.height, a = new Float32Array(W0 * H0), t = document.createElement("canvas"), tx = t.getContext("2d");
      let used = 0;
      for (const e of list.slice(0, 12)) {
        const b = e && e.box_2d, mk = e && typeof e.mask === "string" ? e.mask : "";
        if (!Array.isArray(b) || b.length !== 4 || !b.every(Number.isFinite) || !mk) continue;
        const y0 = Math.max(0, Math.round(b[0] / 1000 * H0)), x0 = Math.max(0, Math.round(b[1] / 1000 * W0)), y1 = Math.min(H0, Math.round(b[2] / 1000 * H0)), x1 = Math.min(W0, Math.round(b[3] / 1000 * W0));
        if (x1 - x0 < 4 || y1 - y0 < 4) continue;
        const src = mk.startsWith("data:image/") ? mk : "data:image/png;base64," + mk;
        const mi = await new Promise(r => { const q2 = new Image(); q2.onload = () => r(q2); q2.onerror = () => r(null); q2.src = src; }); if (!mi) continue;
        t.width = x1 - x0; t.height = y1 - y0; tx.clearRect(0, 0, t.width, t.height); tx.drawImage(mi, 0, 0, t.width, t.height);
        const d = tx.getImageData(0, 0, t.width, t.height).data;
        for (let yy = 0; yy < t.height; yy++) for (let xx = 0; xx < t.width; xx++) { const v = d[(yy * t.width + xx) * 4] / 255, i = (y0 + yy) * W0 + x0 + xx; if (v > a[i]) a[i] = v; }
        used++;
      }
      if (!used) continue;
      let area = 0; for (let i = 0; i < a.length; i++) if (a[i] > 0.5) area++;
      if (area < a.length * 0.03 || area > a.length * 0.97) return null;   // not a clear subject: draw it all
      return {w: W0, h: H0, a};
    }
    return null;
  }
  // an outline from Gemini, at the drawing's size: fill hugs the subject, edge reaches a little past it (soft edges)
  function maskFrom(seg, w, h){
    const f = new Float32Array(w * h), sx = seg.w / w, sy = seg.h / h;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) f[y * w + x] = seg.a[Math.min(seg.h - 1, Math.floor(y * sy)) * seg.w + Math.min(seg.w - 1, Math.floor(x * sx))];
    const box = (a, r) => { const t = new Float32Array(w * h), o = new Float32Array(w * h);
      for (let y = 0; y < h; y++) { let s2 = 0, n = 0; for (let x = -r; x < w + r; x++) { const ad = x + r, rm = x - r - 1; if (ad >= 0 && ad < w) { s2 += a[y * w + ad]; n++; } if (rm >= 0 && rm < w) { s2 -= a[y * w + rm]; n--; } if (x >= 0 && x < w) t[y * w + x] = s2 / n; } }
      for (let x = 0; x < w; x++) { let s2 = 0, n = 0; for (let y = -r; y < h + r; y++) { const ad = y + r, rm = y - r - 1; if (ad >= 0 && ad < h) { s2 += t[ad * w + x]; n++; } if (rm >= 0 && rm < h) { s2 -= t[rm * w + x]; n--; } if (y >= 0 && y < h) o[y * w + x] = s2 / n; } }
      return o; };
    const r = Math.max(1, Math.round(Math.max(w, h) / 450)), soft = box(f, r), wide = box(f, r * 4);
    const fill = new Float32Array(w * h), edge = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) { fill[i] = Math.min(1, Math.max(0, (soft[i] - 0.35) / 0.3)); edge[i] = Math.min(1, Math.max(0, (wide[i] - 0.08) / 0.25)); }
    return {fill, edge};
  }
  function sketch(im, sid, seg){
    const P = styleOf(sid || "marker")[3];
    const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, K = Math.min(1, 900 / Math.max(iw, ih));
    const w = Math.max(8, Math.round(iw * K)), h = Math.max(8, Math.round(ih * K)), N = w * h, f = Math.max(w, h) / 900;
    const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0, w, h);
    const src = x.getImageData(0, 0, w, h).data;
    const L = new Float32Array(N); for (let i = 0; i < N; i++) L[i] = (0.299 * src[i * 4] + 0.587 * src[i * 4 + 1] + 0.114 * src[i * 4 + 2]) / 255;
    const blur = (a, sg) => {
      const r = Math.max(1, Math.ceil(sg * 3)), k = []; let sum = 0; for (let i = -r; i <= r; i++) { const v = Math.exp(-i * i / (2 * sg * sg)); k.push(v); sum += v; } for (let i = 0; i < k.length; i++) k[i] /= sum;
      const t = new Float32Array(N), o = new Float32Array(N);
      for (let y = 0; y < h; y++) { const row = y * w; for (let xx = 0; xx < w; xx++) { let v = 0; for (let i = -r; i <= r; i++) { const X = xx + i < 0 ? 0 : xx + i >= w ? w - 1 : xx + i; v += a[row + X] * k[i + r]; } t[row + xx] = v; } }
      for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) { let v = 0; for (let i = -r; i <= r; i++) { const Y = y + i < 0 ? 0 : y + i >= h ? h - 1 : y + i; v += t[Y * w + xx] * k[i + r]; } o[y * w + xx] = v; }
      return o; };
    const pre = blur(L, P.lines[0] * f), g1 = blur(pre, P.lines[1] * f), g2 = blur(pre, P.lines[2] * f);   // broad enough for the pen's line width, not every hair
    const ink = new Float32Array(N);
    for (let i = 0; i < N; i++) { const D = g1[i] - 0.99 * g2[i], v = D >= -0.004 ? 1 : 1 + Math.tanh(P.phi * (D + 0.004)); ink[i] = 1 - Math.max(0, Math.min(1, v)); }
    // solid ink, a touch thicker (a marker lays down an even line); pencil keeps its soft, fine line
    for (let gr = 0; gr < P.grow; gr++) { const t = new Float32Array(N); for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) { let mx = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = xx + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < w && Y < h && ink[Y * w + X] > mx) mx = ink[Y * w + X]; } t[y * w + xx] = mx; }
      for (let i = 0; i < N; i++) ink[i] = t[i] < 0.35 ? 0 : t[i] > 0.65 ? 1 : (t[i] - 0.35) / 0.3; }
    // drop specks: bits of ink smaller than a short pen stroke
    const minSize = Math.max(14, Math.round(P.speck * f * f)), seen = new Uint8Array(N), stack = [];
    for (let i = 0; i < N; i++) {
      if (ink[i] < 0.5 || seen[i]) continue;
      const comp = []; stack.push(i); seen[i] = 1;
      while (stack.length) { const j = stack.pop(); comp.push(j); const y = (j / w) | 0, xx = j % w;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = xx + dx, Y = y + dy, q = Y * w + X; if (X >= 0 && Y >= 0 && X < w && Y < h && ink[q] >= 0.5 && !seen[q]) { seen[q] = 1; stack.push(q); } } }
      if (comp.length < minSize) comp.forEach(j => { ink[j] = 0; });
    }
    // Colours follow the photo: each line takes the colour of the area around it (smoothed, so fur doesn't speckle), deepened to read as
    // marker; under the lines, a light marker wash of the photo's colours, in flat bands like colouring in.
    const ch = (k, r) => { const a = new Float32Array(N); for (let i = 0; i < N; i++) a[i] = src[i * 4 + k]; return blur(a, r); };
    const cR = ch(0, 2.5 * f), cG = ch(1, 2.5 * f), cB = ch(2, 2.5 * f), wR = ch(0, 6 * f), wG = ch(1, 6 * f), wB = ch(2, 6 * f);
    const hsl = (r, g, b) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
      if (!d) return [0, 0, l]; const s2 = d / (1 - Math.abs(2 * l - 1)); let hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(hh * 60 + 360) % 360, s2, l]; };
    const rgb = (hh, s2, l) => { const c2 = (1 - Math.abs(2 * l - 1)) * s2, x2 = c2 * (1 - Math.abs((hh / 60) % 2 - 1)), m = l - c2 / 2;
      const [r, g, b] = hh < 60 ? [c2, x2, 0] : hh < 120 ? [x2, c2, 0] : hh < 180 ? [0, c2, x2] : hh < 240 ? [0, x2, c2] : hh < 300 ? [x2, 0, c2] : [c2, 0, x2]; return [(r + m) * 255, (g + m) * 255, (b + m) * 255]; };
    // smooth random noise (0..1), for the hand-made unevenness of the colouring
    const hsh = (X, Y, sd) => { let t = (X * 374761393 + Y * 668265263 + sd * 2147483647) | 0; t = Math.imul(t ^ (t >>> 13), 1274126177); return ((t ^ (t >>> 16)) >>> 0) / 4294967295; };
    const vn = (X, Y, sd) => { const x0 = Math.floor(X), y0 = Math.floor(Y), fx = X - x0, fy = Y - y0, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const a0 = hsh(x0, y0, sd), a1 = hsh(x0 + 1, y0, sd), b0 = hsh(x0, y0 + 1, sd), b1 = hsh(x0 + 1, y0 + 1, sd); return (a0 + (a1 - a0) * sx) + ((b0 + (b1 - b0) * sx) - (a0 + (a1 - a0) * sx)) * sy; };
    // only the subject is drawn (its background is left out), when there's a clear one
    let sm = null; try { sm = seg && seg.a ? maskFrom(seg, w, h) : subjectMask(src, w, h); } catch (e) { sm = null; }
    // pencil works from a softened picture, so it keeps the shapes and tones but not every hair (less perfect, more drawn)
    const Ls = P.fill === "shade" ? blur(L, 1.6 * f) : null, pb = Ls ? blur(Ls, 9 * f) : null, ps = Ls ? blur(L, 5 * f) : null;
    // three layers: the flat colouring, marker strokes over it (where they overlap, it darkens, like colouring in by hand), the lines on top
    const base = x.createImageData(w, h), bd = base.data, wash = x.createImageData(w, h), wd = wash.data, lines = x.createImageData(w, h), ld = lines.data;
    for (let i = 0; i < N; i++) {
      // colouring: the photo's colour in a few flat tones; greys and the brightest spots stay white, like paper left showing
      let [hh, s2, l] = hsl(wR[i], wG[i], wB[i]); let b = [255, 255, 255], on = 0;
      if (P.fill === "marker" && s2 > 0.16 && l > 0.06 && l < 0.86) { b = rgb(hh, Math.min(1, s2 * 1.1 + 0.03), Math.max(0.55, 0.82 - Math.min(2, Math.floor((1 - l) * 3)) * 0.08)); on = 1; }
      else if (P.fill === "marker" && sm && sm.fill[i] > 0.5 && l > 0.04 && l < 0.82) { const g0 = (0.88 - Math.min(3, Math.floor((0.82 - l) / 0.2)) * 0.1) * 255; b = [g0, g0 + 1, g0 + 4]; on = 1; }   // greys (the moon, a pencil sketch) get grey marker
      // bold: rich flat colour in three tones (comic-book colouring); near-whites stay white
      if (P.fill === "flat" && l < 0.93 && (s2 > 0.1 || l < 0.75)) { b = s2 > 0.1 ? rgb(hh, Math.min(1, s2 * 1.25 + 0.08), [0.42, 0.58, 0.74][Math.min(2, Math.floor(l * 3))]) : [[90, 94, 102], [150, 154, 160], [205, 208, 212]][Math.min(2, Math.floor(l * 3))]; on = 1; }
      // pencil: blended graphite. Fine detail from each spot against its surroundings (the classic pencil-sketch look), soft shadow
      // where the picture is dark, a faint paper grain; the light parts stay paper white
      if (P.fill === "shade") {
        on = 1; const ratio = Math.min(1, Ls[i] / Math.max(0.03, pb[i])), sm2 = Math.max(0, Math.min(1, (0.78 - ps[i]) / 0.68)), shadow = 1 - 0.32 * sm2 * sm2 * (3 - 2 * sm2);
        const gv = Math.max(0, Math.min(1, Math.pow(ratio, 1.7) * shadow * (0.95 + 0.05 * hsh(i % w, (i / w) | 0, 9))));
        b = [70 + gv * 185, 72 + gv * 183, 78 + gv * 177]; }
      const fl = sm ? sm.fill[i] : 1; b = b.map(v => 255 - fl * (255 - v));
      bd[i * 4] = b[0]; bd[i * 4 + 1] = b[1]; bd[i * 4 + 2] = b[2]; bd[i * 4 + 3] = 255; wd[i * 4 + 3] = Math.round(on * fl * 255);
      const a = sm ? ink[i] * sm.edge[i] : ink[i]; if (a < 0.04) continue;
      // the line: the area's colour, deepened (dark enough to stand out, saturated like marker ink); greys stay near-black
      [hh, s2, l] = hsl(cR[i], cG[i], cB[i]);
      const pr = P.ink === "graphite" ? 0.65 + 0.35 * vn((i % w) / (30 * f), ((i / w) | 0) / (30 * f), 6) : 1;
      const m = P.ink === "black" ? [28, 30, 36] : P.ink === "graphite" ? [74, 76, 82] : s2 < 0.15 ? [34, 38, 45] : rgb(hh, Math.min(1, s2 * 1.2 + 0.08), Math.min(0.3, l * 0.6));
      ld[i * 4] = m[0]; ld[i * 4 + 1] = m[1]; ld[i * 4 + 2] = m[2]; ld[i * 4 + 3] = Math.round(a * pr * (P.ink === "graphite" ? 0.7 : 1) * 255);
    }
    x.putImageData(base, 0, 0);
    // the strokes: soft, slightly curved, see-through, of uneven length and width, going roughly one way in each part of the picture
    let area = 0; for (let i = 0; i < N; i++) if (wd[i * 4 + 3] > 128) area++;
    if (area > N * 0.01 && (P.fill === "marker" || P.fill === "shade")) {
      const sc = document.createElement("canvas"); sc.width = w; sc.height = h; const g = sc.getContext("2d");
      g.lineCap = "round"; g.lineJoin = "round";
      let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      // pencil: loose graphite strokes over the darker parts, following the shapes, so it looks drawn by hand rather than filtered
      if (P.fill === "shade") {
        const n2 = Math.min(5000, Math.round(area / (60 * f * f)));
        for (let q = 0; q < n2; q++) {
          const sx = rnd() * w, sy = rnd() * h, i2 = ((sy | 0) * w + (sx | 0)); if (wd[i2 * 4 + 3] < 128) continue;
          const d = Math.max(0, Math.min(1, (0.7 - ps[i2]) / 0.6)); if (rnd() > d * 1.1) continue;
          const xx = sx | 0, yy = sy | 0, gx = xx > 0 && xx < w - 1 ? ps[i2 + 1] - ps[i2 - 1] : 0, gy = yy > 0 && yy < h - 1 ? ps[i2 + w] - ps[i2 - w] : 0;
          const an = (Math.hypot(gx, gy) > 0.003 ? Math.atan2(gy, gx) + Math.PI / 2 : 0.9) + (rnd() - 0.5) * 0.5, len = (10 + rnd() * 22) * f, bend = (rnd() - 0.5) * 0.4 * len;
          const ex = sx + Math.cos(an) * len, ey = sy + Math.sin(an) * len, mx = (sx + ex) / 2 - Math.sin(an) * bend, my = (sy + ey) / 2 + Math.cos(an) * bend;
          g.strokeStyle = `rgba(70,72,78,${(0.06 + d * 0.12).toFixed(3)})`; g.lineWidth = (1 + rnd() * 1.4) * f;
          g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
        }
      }
      const n = P.fill === "marker" ? Math.min(1600, Math.round(area / (900 * f * f))) : 0;
      for (let q = 0, tries = 0; q < n && tries < n * 6; tries++) {
        const sx = rnd() * w, sy = rnd() * h, i = ((sy | 0) * w + (sx | 0)); if (wd[i * 4 + 3] < 128) continue; q++;
        const an = 0.6 + (vn(sx / (170 * f), sy / (170 * f), 1) - 0.5) * 1.8 + (rnd() - 0.5) * 0.35, len = (35 + rnd() * 90) * f, bend = (rnd() - 0.5) * 0.5 * len;
        const ex = sx + Math.cos(an) * len, ey = sy + Math.sin(an) * len, mx = (sx + ex) / 2 - Math.sin(an) * bend, my = (sy + ey) / 2 + Math.cos(an) * bend;
        g.strokeStyle = `rgba(${bd[i * 4]},${bd[i * 4 + 1]},${bd[i * 4 + 2]},${(0.1 + rnd() * 0.12).toFixed(2)})`; g.lineWidth = (8 + rnd() * 7) * f;
        g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
      }
      // only inside the coloured parts
      const mc = document.createElement("canvas"); mc.width = w; mc.height = h; mc.getContext("2d").putImageData(wash, 0, 0);
      g.globalCompositeOperation = "destination-in"; g.drawImage(mc, 0, 0);
      x.globalCompositeOperation = "multiply"; x.drawImage(sc, 0, 0); x.globalCompositeOperation = "source-over";
    }
    const lc = document.createElement("canvas"); lc.width = w; lc.height = h; lc.getContext("2d").putImageData(lines, 0, 0); x.drawImage(lc, 0, 0);
    return c;
  }
  const MK = [[29, 91, 214], [216, 55, 42], [23, 138, 74], [229, 122, 16], [122, 60, 200], [255, 214, 50]];
  const nearest = (r, g, b) => MK.reduce((best, m) => { const d = (m[0] - r) ** 2 + (m[1] - g) ** 2 + (m[2] - b) ** 2; return d < best[1] ? [m, d] : best; }, [MK[0], Infinity])[0];
  // White becomes see-through (keeping colours true where they're partly see-through), so the drawing sits on the board
  function clearWhite(img){
    const c = document.createElement("canvas"), w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    c.width = w; c.height = h; const x = c.getContext("2d"); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, w, h), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      const a0 = p[i + 3] / 255; if (!a0) continue;
      const mn = Math.min(p[i], p[i + 1], p[i + 2]);
      let a = (255 - mn) / 255; if (a < 0.08) { p[i + 3] = 0; continue; }
      a = Math.min(1, a * 1.15);
      for (let k = 0; k < 3; k++) p[i + k] = Math.max(0, Math.min(255, Math.round((p[i + k] - 255 * (1 - a)) / a)));
      p[i + 3] = Math.round(a * a0 * 255);
    }
    x.putImageData(d, 0, 0); return c;
  }
  // the drawing-style menu, under its button
  function closeStyleMenu(){ const o = W.stage() && W.stage().querySelector(".wb-stylemenu"); if (o) o.remove(); }
  function styleMenu(btn, id){
    const stage = W.stage(); if (!stage) return; if (stage.querySelector(".wb-stylemenu")) { closeStyleMenu(); return; }
    const cur = styleId(), mnu = document.createElement("div"); mnu.className = "wb-stylemenu"; mnu.setAttribute("role", "menu");
    mnu.innerHTML = STYLES.map(x => `<button type="button" role="menuitemradio" aria-checked="${x[0] === cur}" class="${x[0] === cur ? "on" : ""}" data-wb="restyle-as" data-id="${esc(id + "|" + x[0])}"><span class="wb-sw wb-sw-${x[0]}" aria-hidden="true"></span>${esc(x[1])}</button>`).join("");
    stage.appendChild(mnu);
    const r = btn.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    mnu.style.left = Math.max(6, Math.min(r.left - sr.left, sr.width - mnu.offsetWidth - 6)) + "px"; mnu.style.top = (r.bottom - sr.top + 6) + "px";
    setTimeout(() => document.addEventListener("pointerdown", function off(e){ if (!e.target.closest || !e.target.closest(".wb-stylemenu,.wb-style-pick")) { closeStyleMenu(); document.removeEventListener("pointerdown", off, true); } }, true), 0);
  }
  // the original a drawn picture came from: its saved link, or (drawings made before that link) the image file of the same name
  function origOf(it){
    if (it.o && state.files[it.o]) return Object.assign({}, it, {f: it.o, src: undefined});
    const f = it.r && it.f && state.files[it.f];
    if (f) { const base = String(f.name || "").replace(/\s+\(marker\)\.png$/i, "");
      const hit = base && Object.values(state.files).find(x => x && x.id !== f.id && x.kind === "file" && x.revs && x.revs.length && /^image\//.test((curRev(x) || {}).type || "") && String(x.name || "").replace(/\.[a-z0-9]+$/i, "") === base);
      if (hit) return Object.assign({}, it, {f: hit.id, src: undefined}); }
    return it;
  }
  async function restyle(id, sid){
    sid = sid || styleId();
    if (locked()) { upsell(); return; }
    const it = W.getI(id); if (!it || it.k !== "i" || BUSY.has(id)) return;
    // Draw Again starts from the original picture, not the last drawing
    const orig = origOf(it);
    const im = await imageOf(orig); if (!im) { toast("That picture isn't available on this device yet."); return; }
    BUSY.add(id); W.refreshItems();
    let used = "ai", out = null, why = "noimage";
    try { const ai = await aiRedraw(im, sid); if (ai && ai.img) out = clearWhite(ai.img); else why = (ai && ai.why) || why; } catch (e) { out = null; }
    // No picture model on the key (Google's free tier has none): drawn on this device from the picture's own lines
    if (!out) { used = "here"; let seg = null; try { seg = await aiSubject(im); } catch (e) { seg = null; } out = clearWhite(sketch(im, sid, seg)); }
    try {
      const blob = await canvasBlob(out, "image/png");
      const b = W.board(), n = b && state.notes[b.id], f0 = fileOf(it);
      const name = String((f0 && f0.name) || "Picture").replace(/(\s+\(marker\))?\.[a-z0-9]+$/i, "") + " (marker).png";
      const made = blob ? await IO.upload([new File([blob], name, {type: "image/png"})], {courseId: (n && n.courseId) || "", folderId: "notes"}) : [];
      if (!made || !made.length) { toast("Couldn't save the redrawn picture. Try again."); return; }
      const f = made[0], r = curRev(f); if (r && r.assetId) URLS.set(r.assetId, URL.createObjectURL(blob));
      const cur = W.getI(id) || it, ow = out.width, oh = out.height, w = cur.w, h = Math.round(w * oh / ow);
      W.set("i", id, Object.assign({}, cur, {f: f.id, r: 1, o: orig.f || cur.o, h, at: Date.now()}));
      W.select(["i" + id]);
      toast(used === "ai" ? "Redrawn: " + styleOf(sid)[1] : sid === "marker" ? FELL[why] || FELL.noimage : `Drawn on this device: ${styleOf(sid)[1]}`, () => W.undo());
    } finally { BUSY.delete(id); W.refreshItems(); }
  }

  const retry = () => { [...URLS].forEach(([k, v]) => { if (v === "!" || (v === "" && TRIES.has(k))) URLS.delete(k); }); TRIES.clear(); W.refreshItems(); };
  Object.assign(W, {pictures: {add, restyle, IO, sketch, clearWhite, retry, STYLES}});
  const css = document.createElement("style");
  css.textContent = `
.wb-img{position:absolute}
.wb-img.fade{-webkit-mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent),linear-gradient(180deg,transparent,#000 14%,#000 86%,transparent);mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent),linear-gradient(180deg,transparent,#000 14%,#000 86%,transparent);-webkit-mask-composite:source-in;mask-composite:intersect}
.wb-img.fade img{box-shadow:none!important}
.wb-selbar .wb-fade.on{background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent)}
.wb-er{display:block;width:100%;height:100%;-webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat}
.wb-tint{display:block;width:100%;height:100%;-webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat}
.wb-img img{display:block;width:100%;height:100%;object-fit:fill;-webkit-user-drag:none;user-select:none}
.wb-img:not(.drawn) img{box-shadow:0 2px 10px rgba(20,30,45,.18)}
.wb-dk .wb-img-ph{background:#2A323C;border-color:#46505C;color:#AEB7C2}
.wb-img-ph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;background:#EEF1F4;border:2px dashed #C3CCD7;color:#6B7686;font:600 max(14px,2.2%) var(--display);padding:8px}
.wb-img.busy img{filter:grayscale(.6) opacity(.55)}
.wb-img-busy{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(var(--wb-inv,1));display:flex;align-items:center;gap:8px;background:#fff;color:#22262D;border-radius:999px;padding:8px 14px;font:600 14px var(--display);box-shadow:0 4px 14px rgba(0,0,0,.2);white-space:nowrap}
.wb-pic{position:relative}
.wb-pro{position:absolute;right:-2px;top:-3px;font:800 8px/1 var(--display);letter-spacing:.04em;background:linear-gradient(135deg,#F5B83D,#E8833A);color:#fff;border-radius:5px;padding:2px 3px}
.wb-pic .wb-pro{top:auto;bottom:-3px;right:1px}
.wb-selbar .pro-badge{margin-left:2px}
.wb-selbar .wb-ai-btn{background:color-mix(in srgb,#8B5CF6 12%,transparent);color:#6D3FD8;box-shadow:inset 0 0 0 1px color-mix(in srgb,#8B5CF6 40%,transparent);gap:6px}
.wb-selbar .wb-ai-btn:hover{background:color-mix(in srgb,#8B5CF6 20%,transparent)}
.wb-dk .wb-selbar .wb-ai-btn{color:#C4B0FF}
.wb-selbar .wb-ai-btn .wb-chev{margin-left:-2px;opacity:.8}
.wb-stylemenu{position:absolute;z-index:9;display:grid;gap:2px;padding:5px;min-width:170px;border-radius:12px;background:#fff;border:1px solid rgba(0,0,0,.1);box-shadow:0 10px 28px rgba(20,30,45,.2);font:600 .88rem var(--body,system-ui)}
.wb-stylemenu button{display:flex;align-items:center;gap:10px;border:0;background:none;color:#22262D;padding:8px 10px;border-radius:8px;cursor:pointer;text-align:left;font:inherit}
.wb-stylemenu button:hover{background:rgba(0,0,0,.05)}
.wb-stylemenu button.on{background:color-mix(in srgb,#8B5CF6 12%,transparent);color:#6D3FD8}
.wb-dk .wb-stylemenu{background:#262D36;border-color:rgba(255,255,255,.1)}
.wb-dk .wb-stylemenu button{color:#E6EAEE}.wb-dk .wb-stylemenu button:hover{background:rgba(255,255,255,.07)}.wb-dk .wb-stylemenu button.on{color:#C4B0FF}
.wb-sw{width:22px;height:22px;border-radius:6px;flex:none;border:1.5px solid #22262D}
.wb-sw-marker{background:linear-gradient(135deg,#F2C9A0 0 45%,#E9A877 45% 70%,#F2C9A0 70%)}
.wb-sw-outline{background:#fff}
.wb-sw-pencil{border-color:#6B6E75;background:repeating-linear-gradient(45deg,#fff 0 3px,#B9BCC2 3px 4px)}
.wb-sw-bold{border-width:2.5px;background:linear-gradient(135deg,#F26B3A 0 50%,#2F6FDB 50%)}
`;
  document.head.appendChild(css);
})();

