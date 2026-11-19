/* ===== module: 99-present.js ===== */
/* Presentation practice: practise a talk on your own slides, timed.
   - Slides come from a PowerPoint or PDF upload, a Google Slides deck (picked in Google's window, then sent by Google as a
     PowerPoint so its look and speaker notes come along), or a slides file already in a course.
   - Studyboard shows the slides itself, so it knows exactly when you move on: each slide's time is counted from the moment
     you arrive to the moment you leave (going back adds to that slide again). The clock starts when you press play.
   - A target time is split across the slides, evenly or by how long each slide's speaker notes are, and the Stage shows
     how you're doing against it as you go.
   - Recording (Pro) keeps the run's audio on this device and a transcript from the browser's speech recognition, so
     afterwards each slide can be played back and read on its own.
   Everything (the slides, the runs and the recordings) stays on this device, in IndexedDB. */
(() => {
  const DB = "studyboard-present", STORE = "k";
  let dbp = null;
  const db = () => dbp || (dbp = new Promise((res, rej) => { try { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } }));
  const tx = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction(STORE, mode), st = t.objectStore(STORE); const out = fn(st); t.oncomplete = () => res(out && out.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }); };
  const get = k => tx("readonly", st => st.get(k)).catch(() => null);
  const put = (k, v) => tx("readwrite", st => { st.put(v, k); });
  const del = k => tx("readwrite", st => { st.delete(k); }).catch(() => {});

  let LIST = [], LOADED = false;
  const save = () => put("list", LIST).catch(e => { console.warn("present save", e); toast("Couldn't save on this device. It may be out of space.", null, null, {error: true}); });
  const byId = id => LIST.find(p => p.id === id);
  get("list").then(v => { LIST = Array.isArray(v) ? v : []; LOADED = true; if (ui.tab === "flashcards" && ui.rvView === "present") render(); });

  /* ---------- small helpers ---------- */
  const fmt = ms => { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  const fmtSigned = ms => (ms < 0 ? "−" : "+") + fmt(Math.abs(ms));
  const locked = () => { try { return !!(window.SBPRO && SBPRO.locked && SBPRO.locked()); } catch (e) { return false; } };
  const proWhy = why => { try { if (typeof PLAN !== "undefined" && PLAN) PLAN.openSheet(why); } catch (e) {} };
  const IC = {
    present: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><rect x="6" y="4.5" width="4.2" height="15" rx="1.5"/><rect x="13.8" y="4.5" width="4.2" height="15" rx="1.5"/></svg>',
    prev: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    upload: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>',
    gslides: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 2h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#F4B400"/><path d="M14 2v5h5z" fill="#FADB8A"/><rect x="7.5" y="10.5" width="9" height="6.5" rx="1" fill="#fff"/></svg>',
    folder: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
    mic: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>'
  };

  /* ---------- a deck: the slides, drawn on demand ---------- */
  let DECK = null;
  function dropDeck(){ const d = DECK; DECK = null; if (!d) return; try { if (d.res) OFFICE.release(d.res); if (d.doc) d.doc.destroy(); } catch (e) {} }
  const kindOfName = n => /\.pdf$/i.test(n) ? "pdf" : /\.(pptx|pptm|ppsx|ppsm|potx)$/i.test(n) ? "pptx" : "";
  async function openDeck(bytes, kind){
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if (kind === "pdf") {
      await loadPdfJs();
      const doc = await window.pdfjsLib.getDocument({data: u8.slice(), ...PDF_OPTS}).promise;
      const p1 = (await doc.getPage(1)).getViewport({scale: 1});
      let title = "";
      try { const tc = await (await doc.getPage(1)).getTextContent(); title = tc.items.map(x => x.str || "").join(" ").replace(/\s+/g, " ").trim().slice(0, 90); } catch (e) {}
      return {kind, doc, n: doc.numPages, ratio: p1.width / p1.height, notes: Array(doc.numPages).fill(""), title};
    }
    const res = await OFFICE.render(u8, "slides.pptx");
    if (!res.pages.length) throw new Error("That file has no slides.");
    const first = String(res.text || "").split("\n").map(s => s.trim()).find(s => s && !/^(slide|page)\s*\d+\s*:?$/i.test(s)) || "";
    return {kind: "pptx", res, n: res.pages.length, ratio: res.pages[0].w / res.pages[0].h, notes: res.pages.map(p => String(p.notes || "").trim()), title: first.slice(0, 90)};
  }
  async function deckFor(p){
    if (DECK && DECK.id === p.id) return DECK;
    dropDeck();
    const bytes = await get("deck:" + p.id);
    if (!bytes) throw new Error("This presentation's slides aren't on this device. Add them again from the same file.");
    const d = await openDeck(bytes, p.kind); d.id = p.id; DECK = d; return d;
  }
  // Draws slide i into el, w pixels wide (its height follows the slide's shape)
  async function drawSlide(d, i, el, w){
    w = Math.max(40, Math.round(w)); const h = Math.round(w / d.ratio);
    if (d.kind === "pptx") {
      const pg = d.res.pages[i]; if (!pg) return;
      el.innerHTML = `<div class="pr-frame" style="width:${w}px;height:${h}px"><div class="pr-in" style="width:${pg.w}px;height:${pg.h}px;transform:scale(${w / pg.w})">${pg.html}</div></div>`;
      return;
    }
    const tok = (el.dataset.tok = String(Math.random()));
    const page = await d.doc.getPage(i + 1), v = page.getViewport({scale: 1}), dpr = Math.min(2, window.devicePixelRatio || 1), vp = page.getViewport({scale: w / v.width * dpr});
    const c = document.createElement("canvas"); c.width = Math.floor(vp.width); c.height = Math.floor(vp.height); c.style.width = w + "px"; c.style.height = h + "px";
    await page.render({canvasContext: c.getContext("2d"), viewport: vp}).promise;
    if (el.dataset.tok !== tok) return;
    const fr = document.createElement("div"); fr.className = "pr-frame"; fr.style.width = w + "px"; fr.style.height = h + "px"; fr.appendChild(c);
    el.replaceChildren(fr);
  }

  /* ---------- budgets: the target split across the slides ---------- */
  function budgets(p, d){
    const n = d ? d.n : p.slides, T = (p.target || 60 * n) * 1000;
    if (p.split === "notes" && d && d.notes.some(Boolean)) {
      const w = d.notes.map(t => 25 + String(t).split(/\s+/).filter(Boolean).length), sum = w.reduce((a, b) => a + b, 0);
      return w.map(x => T * x / sum);
    }
    return Array(n).fill(T / n);
  }
  const tone = (ms, b) => ms <= b * 1.17 ? "ok" : ms <= b * 1.5 ? "warn" : "over";

  /* ---------- the Review tab's Presentations ---------- */
  const bestOf = p => (p.runs || []).reduce((m, r) => m == null || r.total < m ? r.total : m, null);
  function cardHtml(p){
    const c = courseOf(p.courseId), runs = p.runs || [], best = bestOf(p), nm = esc(p.name || "Presentation"), tgt = (p.target || 0) * 1000;
    const meta = runs.length ? `Best ${fmt(best)} · target ${fmt(tgt)}` : `Target ${fmt(tgt)} · not practised yet`;
    const stamp = best == null ? "New" : fmt(best), good = best != null && best <= tgt + 10000;
    return `<article class="rv-card rv-pres" style="--c:${esc(colorOf(p.courseId))}">
      <button class="rv-peek pr-peek" data-act="pr-open" data-id="${esc(p.id)}" aria-label="Open ${nm}">
        <span class="pr-sh s3" aria-hidden="true"></span><span class="pr-sh s2" aria-hidden="true"></span>
        <span class="pr-sh s1" aria-hidden="true"><b>${esc(p.title || p.name || "")}</b><i></i><i></i></span>
        <span class="rv-chip"><span class="fc-ic" aria-hidden="true">${c ? courseRingHtml(c) : GENERAL_ICON}</span>${esc(c ? courseLabel(c) : "General")}</span>
        <span class="rv-count">${p.slides} slide${p.slides === 1 ? "" : "s"}</span>
        <span class="rv-stamp pr-stamp${best == null ? " new" : good ? " good" : ""}" aria-hidden="true">${stamp}</span>
      </button>
      <div class="rv-foot"><button class="rv-info" data-act="pr-open" data-id="${esc(p.id)}"><b class="rv-title">${nm}</b></button>
        <div class="rv-row"><span class="mini rv-sub">${meta}${runs.length ? ` · ${runs.length} run${runs.length === 1 ? "" : "s"}` : ""}</span>
        <div class="rv-cacts"><button class="icon-btn rv-ib" data-act="pr-del" data-id="${esc(p.id)}" aria-label="Delete ${nm}" title="Delete">${IC.trash}</button><button class="btn small primary rv-go" data-act="pr-practise" data-id="${esc(p.id)}">Practise</button></div></div></div>
    </article>`;
  }
  function listHtml(){
    const f = ui.filter && ui.filter !== "all" ? ui.filter : "", q = String(ui.q || "").trim().toLowerCase();
    const list = LIST.filter(p => !f || p.courseId === f).filter(p => !q || [p.name, p.title, (courseOf(p.courseId) || {}).name].join(" ").toLowerCase().includes(q)).sort((a, b) => (b.updated || 0) - (a.updated || 0));
    const head = `<div class="view-head" data-pr-list><h2>Presentations</h2></div>${typeof chipsHtml === "function" ? chipsHtml() : ""}`;
    if (!LOADED) return head;
    if (!list.length) return head + `<div class="empty${LIST.length ? "" : " sb-es"}" style="margin-top:14px">${LIST.length ? "" : emptyArt("present")}<strong>${LIST.length ? "No Presentations Match" : "No Presentations Yet"}</strong>${LIST.length ? "Try another course or search." : "Add your slides and set a target time. Studyboard times each slide as you practise, and can record you so you can listen back and read what you said."}${LIST.length ? "" : `<div class="row-actions" style="justify-content:center;margin-top:12px"><button class="btn primary" data-act="pr-new">Practise a Presentation</button></div>`}</div>`;
    return head + `<div class="rv-grid pr-grid">${list.map(cardHtml).join("")}</div>`;
  }

  /* ---------- adding slides ---------- */
  let ADD = null; // {bytes, kind, name, source, gid, fileId, deck}
  const targetRow = (secs, idp) => `<div class="pr-tgt" data-pr-tgt>
      <button type="button" class="pr-step" data-act="pr-tgt" data-d="-30" aria-label="30 seconds less">−</button>
      <output id="${idp}" class="pr-tgt-v" aria-live="polite">${fmt(secs * 1000)}</output>
      <button type="button" class="pr-step" data-act="pr-tgt" data-d="30" aria-label="30 seconds more">+</button></div>`;
  function newSheet(courseId){
    ADD = {courseId: courseId || (ui.filter && ui.filter !== "all" ? ui.filter : ""), target: 0, split: "even"};
    drawNew();
  }
  function drawNew(){
    const A = ADD; if (!A) return;
    const cloud = window.SBCLOUD, canG = !!(cloud && cloud.canPickFiles && cloud.canPickFiles() && cloud.pickGoogleSlides);
    const files = Object.values(state.files || {}).filter(f => f && f.kind === "file" && f.revs && f.revs.length && kindOfName(fileNameOf(f)) && (!A.courseId || f.courseId === A.courseId)).slice(0, 60);
    const picked = A.deck ? `<div class="pr-picked"><span class="pr-ftype">${A.kind === "pdf" ? "PDF" : "PPTX"}</span><b>${esc(A.name)}</b><span class="mini">${A.deck.n} slide${A.deck.n === 1 ? "" : "s"}${A.deck.notes.some(Boolean) ? " · speaker notes found" : ""}</span></div>` : "";
    const busy = A.busy ? `<p class="pr-busy"><span class="ai-spin" aria-hidden="true"></span>${esc(A.busy)}</p>` : "";
    const err = A.err ? `<p class="pr-err" role="alert">${esc(A.err)}</p>` : "";
    openSheet(`<form class="sheet pr-sheet">${bandHead("Practise a Presentation", IC.present, "#7A4FD6")}
      <div class="sheet-body">
        <div class="pr-src" role="group" aria-label="Where your slides are">
          <label class="pr-srcb">${IC.upload}<b>Upload</b><span>PowerPoint or PDF</span><input type="file" id="prFile" accept=".pptx,.ppsx,.pptm,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation" class="sr"></label>
          <button type="button" class="pr-srcb" data-act="pr-gslides" ${canG ? "" : `aria-describedby="prGHint"`}>${IC.gslides}<b>Google Slides</b><span>${canG ? "Pick from your Drive" : "Connect Google Drive first"}</span></button>
          <label class="pr-srcb">${IC.folder}<b>From a course</b><span>${files.length ? `${files.length} slide file${files.length === 1 ? "" : "s"}` : "No slide files yet"}</span><select id="prCF" ${files.length ? "" : "disabled"} aria-label="A slides file from your courses"><option value="">Choose…</option>${files.map(f => `<option value="${esc(f.id)}">${esc(fileNameOf(f))}</option>`).join("")}</select></label>
        </div>
        ${canG ? "" : `<p class="mini" id="prGHint">To use Google Slides, connect Google Drive in Settings, Files and Cloud.</p>`}
        ${busy}${err}${picked}
        <label class="f">Name<input name="name" id="prName" value="${esc(A.title || "")}" placeholder="e.g. Essay 2 presentation" maxlength="120"></label>
        <label class="f">Course<select name="courseId" id="prCourse">${courseSelectHtml(A.courseId)}</select></label>
        <div class="f"><span class="lh">Target Time</span>${targetRow(A.target || (A.deck ? A.deck.n * 60 : 300), "prTgtV")}<span class="mini pr-tgt-hint">${A.deck ? `About ${fmt((A.target || A.deck.n * 60) * 1000 / A.deck.n)} a slide` : "Add your slides to see the time per slide"}</span></div>
        <div class="f"><span class="lh">Time per Slide</span><div class="segb" role="group" aria-label="Time per slide"><button type="button" data-act="pr-split" data-id="even" aria-pressed="${A.split !== "notes"}">Even</button><button type="button" data-act="pr-split" data-id="notes" aria-pressed="${A.split === "notes"}">By Speaker Notes</button></div></div>
        <p class="mini">Your slides open here in Studyboard, so it knows the moment you move to the next one: use the arrow keys, Space, a presentation clicker, or tap the slide. They stay on this device.</p>
      </div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-act="pr-create" ${A.deck && !A.busy ? "" : "disabled"}>Continue</button></div></form>`);
    const fi = dlg.querySelector("#prFile");
    if (fi) fi.addEventListener("change", () => { const f = fi.files && fi.files[0]; if (f) fromBlob(f, f.name, "upload"); });
    const cf = dlg.querySelector("#prCF");
    if (cf) cf.addEventListener("change", () => { const f = state.files[cf.value]; if (f) fromCourseFile(f); });
    const nm = dlg.querySelector("#prName"); if (nm) nm.addEventListener("input", () => { A.title = nm.value; });
    const co = dlg.querySelector("#prCourse"); if (co) co.addEventListener("change", () => { A.courseId = co.value; });
  }
  async function useBytes(bytes, name, extra){
    const A = ADD; if (!A) return;
    const kind = kindOfName(name) || (bytes[0] === 0x25 && bytes[1] === 0x50 ? "pdf" : "pptx");
    A.busy = "Opening your slides…"; A.err = ""; drawNew();
    try {
      const deck = await openDeck(bytes, kind);
      if (ADD !== A) return;
      if (A.deck) { try { if (A.deck.res) OFFICE.release(A.deck.res); if (A.deck.doc) A.deck.doc.destroy(); } catch (e) {} }
      Object.assign(A, {bytes, kind, name, deck, busy: "", target: deck.n * 60, title: A.title || String(name).replace(/\.[a-z0-9]+$/i, "")}, extra || {});
    } catch (e) {
      if (ADD !== A) return;
      A.busy = ""; A.err = (e && e.office) || /no slides/.test(String(e && e.message)) ? String(e.message) : "Studyboard couldn't open that file. Use a PowerPoint (.pptx) or PDF.";
    }
    drawNew();
  }
  async function fromBlob(b, name, source){
    if (b.size > 150 * 1024 * 1024) { ADD.err = "That file is over 150 MB. Save a smaller copy or a PDF and try again."; drawNew(); return; }
    if (!kindOfName(name)) { ADD.err = /\.(ppt|key|odp)$/i.test(name) ? "Save it as a PowerPoint (.pptx) or PDF first, then add it here." : "Use a PowerPoint (.pptx) or PDF."; drawNew(); return; }
    useBytes(new Uint8Array(await b.arrayBuffer()), name, {source});
  }
  async function fromCourseFile(f){
    ADD.busy = "Getting the file…"; ADD.err = ""; drawNew();
    try { const bytes = await fileBytes(f); useBytes(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), fileNameOf(f), {source: "file", fileId: f.id, courseId: ADD.courseId || f.courseId || ""}); }
    catch (e) { ADD.busy = ""; ADD.err = String((e && e.message) || "Couldn't get that file.").slice(0, 200); drawNew(); }
  }
  const GEXPORT = (id, mime) => `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}/export?mimeType=${encodeURIComponent(mime)}`;
  const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  // Google sends the deck as a PowerPoint (its look and speaker notes), or as a PDF when it's too big for that
  async function googleBytes(id){
    const C = window.SBCLOUD;
    let r = await C.docApi("google", GEXPORT(id, PPTX_MIME), null, "raw");
    if (r.ok) return {bytes: new Uint8Array(await r.arrayBuffer()), kind: "pptx"};
    if (r.status === 403 || r.status === 413) { r = await C.docApi("google", GEXPORT(id, "application/pdf"), null, "raw"); if (r.ok) return {bytes: new Uint8Array(await r.arrayBuffer()), kind: "pdf"}; }
    if (r.status === 404) throw new Error("Google couldn't find that presentation. Check it's still in your Drive.");
    if (r.status === 403) throw new Error("This presentation is too big for Google to send. In Google Slides choose File, Download, PowerPoint, then upload that file here.");
    throw new Error(`Google Slides didn't send the presentation (${r.status}). Try again.`);
  }
  async function fromGoogle(){
    const C = window.SBCLOUD;
    if (!C || !C.canPickFiles() || !C.pickGoogleSlides) { ADD.err = "Connect Google Drive in Settings, Files and Cloud, then try again."; drawNew(); return; }
    let d; try { d = await C.pickGoogleSlides(); } catch (e) { ADD.err = String((e && e.message) || "Couldn't open Google Drive.").slice(0, 200); drawNew(); return; }
    if (!d) return;
    if (d.type && d.type !== "application/vnd.google-apps.presentation") { ADD.err = "That isn't a Google Slides presentation."; drawNew(); return; }
    ADD.busy = "Getting it from Google Slides…"; ADD.err = ""; drawNew();
    try { const g = await googleBytes(d.id); useBytes(g.bytes, d.name + (g.kind === "pdf" ? ".pdf" : ".pptx"), {source: "gslides", gid: d.id}); }
    catch (e) { ADD.busy = ""; ADD.err = String((e && e.message) || "Couldn't get it from Google Slides.").slice(0, 240); drawNew(); }
  }
  async function create(){
    const A = ADD; if (!A || !A.deck) return;
    const nm = (dlg.querySelector("#prName") || {}).value, co = (dlg.querySelector("#prCourse") || {}).value;
    const p = {id: uid(), name: String(nm || A.title || "Presentation").trim().slice(0, 120) || "Presentation", title: A.deck.title || "", courseId: co || "", kind: A.kind, source: A.source || "upload",
      gid: A.gid || "", fileId: A.fileId || "", slides: A.deck.n, target: A.target || A.deck.n * 60, split: A.split || "even", rec: !locked(), notes: true, runs: [], created: Date.now(), updated: Date.now()};
    try { await put("deck:" + p.id, A.bytes); } catch (e) { toast("There isn't room on this device for these slides.", null, null, {error: true}); return; }
    dropDeck(); A.deck.id = p.id; DECK = A.deck; ADD = null;
    LIST.unshift(p); save();
    if (dlg.open) dlg.close();
    if (ui.tab === "flashcards") { if (typeof rvSet === "function") rvSet("present"); render(); }
    stageOpen(p.id);
  }
  // A Google Slides deck can be brought up to date before a run
  async function refreshGoogle(p){
    const S = STG; if (!S) return;
    S.note = "Getting the latest from Google Slides…"; paintReady();
    try {
      const g = await googleBytes(p.gid), d = await openDeck(g.bytes, g.kind);
      await put("deck:" + p.id, g.bytes);
      dropDeck(); d.id = p.id; DECK = d;
      Object.assign(p, {kind: g.kind, slides: d.n, title: d.title || p.title, updated: Date.now()}); save();
      if (STG === S) { S.d = d; S.b = budgets(p, d); S.note = "Up to date with Google Slides."; S.i = 0; stageBuild(); }
    } catch (e) { if (STG === S) { S.note = String((e && e.message) || "Couldn't reach Google Slides.").slice(0, 200); paintReady(); } }
  }

  /* ---------- the Stage: practising ---------- */
  let STG = null;
  const now = () => performance.now();
  const clockMs = S => S.acc + (S.running ? now() - S.t0 : 0);
  function slideTimes(S){
    const t = Array(S.d.n).fill(0);
    S.seg.forEach(g => { t[g.i] += g.b - g.a; });
    if (S.open) t[S.open.i] += clockMs(S) - S.open.a;
    return t;
  }
  async function stageOpen(id){
    const p = byId(id); if (!p) return;
    if (dlg.open) dlg.close();
    stageClose(true);
    const el = document.createElement("div");
    el.id = "prStage"; el.className = "pr-stage"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Practise " + (p.name || "presentation"));
    el.innerHTML = `<p class="pr-wait"><span class="ai-spin" aria-hidden="true"></span>Opening your slides…</p>`;
    document.body.appendChild(el); document.body.classList.add("pr-on");
    const S = STG = {p, el, d: null, i: 0, acc: 0, t0: 0, running: false, started: false, seg: [], open: null, tr: [], interim: "", rec: !!p.rec && !locked(), showNotes: p.notes !== false, note: ""};
    try { S.d = await deckFor(p); } catch (e) { if (STG !== S) return; el.innerHTML = `<div class="pr-wait"><p>${esc(String((e && e.message) || "Couldn't open these slides."))}</p><button type="button" class="btn" data-act="pr-close">Close</button></div>`; return; }
    if (STG !== S) return;
    if (S.d.n !== p.slides) { p.slides = S.d.n; save(); }
    S.b = budgets(p, S.d);
    stageBuild();
  }
  function stageBuild(){
    const S = STG; if (!S) return;
    const p = S.p, c = courseOf(p.courseId);
    S.el.classList.remove("pr-light");
    S.el.innerHTML = `<div class="pr-top">
        ${c ? `<span class="pr-course" style="--c:${esc(colorOf(p.courseId))}">${esc(courseLabel(c))}</span>` : ""}
        <b class="pr-name">${esc(p.name)}</b>
        <span class="pr-rec" id="prRec" hidden><i></i>Recording</span>
        <span class="pr-clock"><b id="prClock">0:00</b><span>of ${fmt(p.target * 1000)}</span></span>
        <span class="pr-pace" id="prPace" hidden></span>
        <button type="button" class="pr-end" data-act="pr-end">End</button>
      </div>
      <div class="pr-mid">
        <button type="button" class="pr-nav" data-act="pr-prev" aria-label="Previous slide">${IC.prev}</button>
        <div class="pr-slide-wrap"><button type="button" class="pr-slide" id="prSlide" data-act="pr-next" aria-label="Next slide"></button><div class="pr-notes" id="prNotes" hidden></div></div>
        <button type="button" class="pr-nav pr-nav-next" data-act="pr-next" aria-label="Next slide">${IC.next}</button>
      </div>
      <div class="pr-cap" id="prCap" hidden></div>
      <div class="pr-strip" id="prStrip">${Array.from({length: S.d.n}, (_, i) => `<button type="button" class="pr-th" data-act="pr-go" data-i="${i}" aria-label="Slide ${i + 1}"><span class="pr-th-pic" data-th="${i}"></span><span class="pr-th-bar"><i></i></span><span class="pr-th-t">${fmt(S.b[i])}</span></button>`).join("")}</div>
      <p class="sr" id="prLive" aria-live="polite"></p>
      <div class="pr-ready" id="prReady"></div>`;
    paintReady(); drawCur(); drawThumbs(); paint();
  }
  function paintReady(){
    const S = STG; if (!S) return; const box = S.el.querySelector("#prReady"); if (!box) return;
    if (S.started) { box.hidden = true; box.innerHTML = ""; return; }
    const p = S.p, lk = locked(), canRec = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && typeof window.MediaRecorder === "function");
    box.hidden = false;
    box.innerHTML = `<div class="pr-card" role="group" aria-label="Ready to practise">
      <b class="pr-card-h">Ready when you are</b>
      <div class="pr-card-row"><span>Target time</span>${targetRow(p.target, "prTgtS")}</div>
      <span class="pr-card-sub">About ${fmt(p.target * 1000 / S.d.n)} a slide · ${S.d.n} slides</span>
      <div class="segb pr-split" role="group" aria-label="Time per slide"><button type="button" data-act="pr-split" data-id="even" aria-pressed="${p.split !== "notes"}">Even</button><button type="button" data-act="pr-split" data-id="notes" aria-pressed="${p.split === "notes"}" ${S.d.notes.some(Boolean) ? "" : "disabled title=\"These slides have no speaker notes\""}>By Speaker Notes</button></div>
      <label class="pr-tog"><span><b>Record me</b>${lk ? ` ${PRO_BADGE}` : ""}<em>Listen back and read a transcript for each slide</em></span><input type="checkbox" id="prRecOn" ${S.rec ? "checked" : ""} ${canRec ? "" : "disabled"}></label>
      <label class="pr-tog"><span><b>Show speaker notes</b><em>${S.d.notes.some(Boolean) ? "Below each slide, only for you" : "These slides have none"}</em></span><input type="checkbox" id="prNotesOn" ${S.showNotes ? "checked" : ""} ${S.d.notes.some(Boolean) ? "" : "disabled"}></label>
      ${p.source === "gslides" && p.gid ? `<button type="button" class="btn small" data-act="pr-gfresh">Get Latest From Google Slides</button>` : ""}
      ${S.note ? `<p class="mini pr-card-note">${esc(S.note)}</p>` : ""}
      <button type="button" class="pr-play" data-act="pr-play" aria-label="Start: the clock starts now">${IC.play}</button>
      <span class="pr-card-sub">The clock starts when you press play. Space or → for the next slide.</span>
    </div>`;
    const r = box.querySelector("#prRecOn");
    if (r) r.addEventListener("change", () => { if (r.checked && locked()) { r.checked = false; proWhy("Recording a practice run is part of Studyboard Pro: listen back to each slide and read what you said."); return; } S.rec = r.checked; S.p.rec = r.checked; save(); });
    const n = box.querySelector("#prNotesOn");
    if (n) n.addEventListener("change", () => { S.showNotes = n.checked; S.p.notes = n.checked; save(); drawCur(); });
  }
  function slideBox(){ const S = STG, el = S && S.el.querySelector("#prSlide"); if (!el) return 0; const wrap = el.parentElement, mid = S.el.querySelector(".pr-mid"); const W = wrap.clientWidth, H = mid.clientHeight - (S.showNotes && S.d.notes[S.i] ? 92 : 0); return Math.max(120, Math.min(W, H * S.d.ratio)); }
  function drawCur(){
    const S = STG; if (!S || !S.d) return;
    const el = S.el.querySelector("#prSlide"); if (!el) return;
    drawSlide(S.d, S.i, el, slideBox()).catch(() => {});
    el.setAttribute("aria-label", `Slide ${S.i + 1} of ${S.d.n}. ${S.i + 1 < S.d.n ? "Next slide" : "Finish"}`);
    const nt = S.el.querySelector("#prNotes"), t = S.d.notes[S.i];
    if (nt) { nt.hidden = !(S.showNotes && t); nt.textContent = t || ""; }
    S.el.querySelectorAll(".pr-th").forEach((b, k) => { b.classList.toggle("on", k === S.i); if (k === S.i) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
    const cur = S.el.querySelector(".pr-th.on"); if (cur && cur.scrollIntoView) cur.scrollIntoView({block: "nearest", inline: "nearest"});
    const live = S.el.querySelector("#prLive"); if (live && S.started) live.textContent = `Slide ${S.i + 1} of ${S.d.n}`;
  }
  async function drawThumbs(){
    const S = STG; if (!S) return;
    for (const el of S.el.querySelectorAll("[data-th]")) {
      if (STG !== S) return;
      try { await drawSlide(S.d, Number(el.dataset.th), el, el.clientWidth || 110); } catch (e) {}
    }
  }
  function paint(){
    const S = STG; if (!S || !S.d || !S.el.isConnected) return;
    const t = slideTimes(S), el = clockMs(S), tgt = S.p.target * 1000;
    const ck = S.el.querySelector("#prClock"); if (ck) ck.textContent = fmt(el);
    S.el.querySelectorAll(".pr-th").forEach((b, k) => {
      const done = t[k] > 0, bar = b.querySelector(".pr-th-bar i"), lbl = b.querySelector(".pr-th-t");
      bar.style.width = Math.min(100, t[k] / S.b[k] * 100) + "%"; bar.className = "t-" + tone(t[k], S.b[k]);
      lbl.textContent = k === S.i && S.started ? `${fmt(t[k])} · aim ${fmt(S.b[k])}` : done ? fmt(t[k]) : fmt(S.b[k]);
      b.classList.toggle("done", done && k !== S.i);
    });
    const pace = S.el.querySelector("#prPace");
    if (pace && S.started) {
      const before = S.b.slice(0, S.i).reduce((a, x) => a + x, 0), d = el - (before + Math.min(t[S.i], S.b[S.i]));
      const over = el > tgt;
      pace.hidden = false;
      pace.className = "pr-pace " + (over ? "p-over" : d > 15000 ? "p-behind" : d < -15000 ? "p-ahead" : "p-ok");
      pace.textContent = over ? `${fmt(el - tgt)} over` : d > 15000 ? `${fmt(d)} behind` : d < -15000 ? `${fmt(-d)} ahead` : "On pace";
    }
    const rec = S.el.querySelector("#prRec"); if (rec) { rec.hidden = !(S.started && S.recOn); rec.classList.toggle("paused", !S.running); rec.lastChild.textContent = S.running ? "Recording" : "Paused"; }
    const cap = S.el.querySelector("#prCap"); if (cap) { const line = S.interim || (S.tr.length ? S.tr[S.tr.length - 1].s : ""); cap.hidden = !(S.recOn && S.srOn && line); cap.textContent = line; }
  }
  let tick = 0;
  const loop = () => { clearInterval(tick); tick = setInterval(() => { if (!STG || !STG.el.isConnected) { clearInterval(tick); return; } paint(); }, 250); };
  // the clock starts on play; recording (if on) starts with it
  async function play(){
    const S = STG; if (!S || S.running) return;
    if (!S.started) {
      if (S.rec) await recStart(S);
      if (STG !== S) return;
      S.started = true; S.startedAt = Date.now(); paintReady();
      S.open = {i: S.i, a: 0};
      wake(true);
    }
    S.t0 = now(); S.running = true;
    if (S.mr && S.mr.state === "paused") try { S.mr.resume(); } catch (e) {}
    srRun(S);
    setPlayBtn(); loop(); paint(); drawCur();
  }
  function pause(){
    const S = STG; if (!S || !S.running) return;
    S.acc = clockMs(S); S.running = false;
    if (S.mr && S.mr.state === "recording") try { S.mr.pause(); } catch (e) {}
    srStop(S);
    setPlayBtn(); paint();
  }
  function setPlayBtn(){
    const S = STG; if (!S) return;
    let b = S.el.querySelector("#prPause");
    if (!b) { const top = S.el.querySelector(".pr-top .pr-end"); if (!top) return; top.insertAdjacentHTML("beforebegin", `<button type="button" class="pr-pp" id="prPause" data-act="pr-pp"></button>`); b = S.el.querySelector("#prPause"); }
    b.innerHTML = S.running ? IC.pause : IC.play; b.setAttribute("aria-label", S.running ? "Pause" : "Resume");
    S.el.classList.toggle("pr-paused", S.started && !S.running);
  }
  function go(i){
    const S = STG; if (!S || !S.d) return;
    i = Math.max(0, Math.min(S.d.n - 1, i)); if (i === S.i) return;
    if (S.started) { const t = clockMs(S); if (S.open) S.seg.push({i: S.open.i, a: S.open.a, b: t}); S.open = {i, a: t}; }
    S.i = i; drawCur(); paint();
  }
  function next(){
    const S = STG; if (!S) return;
    if (!S.started) { play(); return; }
    if (S.i + 1 >= S.d.n) { finish(); return; }
    go(S.i + 1);
  }

  /* ---------- recording: the whole run's audio, and a transcript by phrase ---------- */
  const SRC = () => window.SpeechRecognition || window.webkitSpeechRecognition || null;
  async function recStart(S){
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: true, noiseSuppression: true}});
      if (STG !== S) { stream.getTracks().forEach(t => t.stop()); return; }
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find(m => { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } }) || "";
      const mr = new MediaRecorder(stream, mime ? {mimeType: mime, audioBitsPerSecond: 48000} : {audioBitsPerSecond: 48000});
      S.chunks = []; S.mime = mr.mimeType || mime || "audio/webm";
      mr.ondataavailable = e => { if (e.data && e.data.size) S.chunks.push(e.data); };
      mr.start(1000);
      Object.assign(S, {mr, stream, recOn: true, srOn: !!SRC()});
      if (!SRC()) toast("Recording. This browser can't make a transcript, so you'll have the audio only.");
    } catch (e) {
      S.recOn = false;
      toast(e && e.name === "NotAllowedError" ? "Studyboard isn't allowed to use the microphone, so this run isn't recorded. Allow it in your browser or device settings." : "Couldn't start the microphone, so this run isn't recorded.");
    }
  }
  function srRun(S){
    if (!S.recOn || !SRC() || S.sr) return;
    let sr; try { sr = new (SRC())(); } catch (e) { S.srOn = false; return; }
    sr.continuous = true; sr.interimResults = true; sr.lang = (navigator.language || "en-US");
    let at = null;
    sr.onresult = ev => {
      for (let k = ev.resultIndex; k < ev.results.length; k++) {
        const x = ev.results[k], s = String(x[0].transcript || "").trim();
        if (at == null) at = clockMs(S);
        if (x.isFinal) { if (s) S.tr.push({t: Math.round(at), e: Math.round(clockMs(S)), s}); at = null; S.interim = ""; }
        else S.interim = s;
      }
    };
    sr.onerror = e => { if (e && /not-allowed|service-not-allowed/.test(e.error)) S.srOn = false; };
    sr.onend = () => { if (S.sr === sr) S.sr = null; if (STG === S && S.running && S.srOn) setTimeout(() => srRun(S), 150); };
    S.sr = sr; try { sr.start(); } catch (e) { S.sr = null; }
  }
  function srStop(S){ const sr = S.sr; S.sr = null; S.interim = ""; if (sr) try { sr.stop(); } catch (e) {} }
  function recStop(S){
    return new Promise(res => {
      srStop(S);
      const mr = S.mr, done = () => { if (S.stream) S.stream.getTracks().forEach(t => t.stop()); res(S.chunks && S.chunks.length ? new Blob(S.chunks, {type: S.mime}) : null); };
      if (!mr || mr.state === "inactive") { done(); return; }
      mr.onstop = done; try { mr.stop(); } catch (e) { done(); }
    });
  }

  /* ---------- finishing a run ---------- */
  async function finish(){
    const S = STG; if (!S) return;
    if (!S.started || clockMs(S) < 2000) { stageClose(); return; }
    if (S.running) { S.acc = clockMs(S); S.running = false; }
    if (S.open) { S.seg.push({i: S.open.i, a: S.open.a, b: S.acc}); S.open = null; }
    clearInterval(tick); wake(false);
    S.el.innerHTML = `<p class="pr-wait"><span class="ai-spin" aria-hidden="true"></span>Saving your run…</p>`;
    const blob = S.recOn ? await recStop(S) : null;
    const t = Array(S.d.n).fill(0); S.seg.forEach(g => { t[g.i] += g.b - g.a; });
    const run = {id: uid(), at: S.startedAt || Date.now(), total: Math.round(S.acc), times: t.map(Math.round), budgets: S.b.map(Math.round), target: S.p.target, seg: S.seg.map(g => [g.i, Math.round(g.a), Math.round(g.b)]), tr: S.tr, audio: false, mime: blob ? blob.type : ""};
    if (blob) { try { await put("audio:" + run.id, blob); run.audio = true; } catch (e) { toast("There wasn't room on this device for the recording. Your times are saved.", null, null, {error: true}); } }
    const p = S.p; p.runs = [run].concat(p.runs || []);
    // keep the 20 newest runs (and their recordings)
    p.runs.slice(20).forEach(r => { if (r.audio) del("audio:" + r.id); }); p.runs = p.runs.slice(0, 20);
    p.updated = Date.now(); save();
    STG = null;
    reviewOpen(p.id, run.id, S.el);
  }
  function stageClose(quiet){
    const S = STG; STG = null; clearInterval(tick); wake(false);
    if (S) { srStop(S); if (S.mr && S.mr.state !== "inactive") try { S.mr.stop(); } catch (e) {} if (S.stream) S.stream.getTracks().forEach(t => t.stop()); }
    reviewStop();
    const el = document.getElementById("prStage"); if (el) el.remove();
    document.body.classList.remove("pr-on");
    if (!quiet && ui.tab === "flashcards" && ui.rvView === "present") render();
  }
  let WL = null;
  function wake(on){ try { if (on && navigator.wakeLock) navigator.wakeLock.request("screen").then(l => { WL = l; }).catch(() => {}); else if (!on && WL) { WL.release().catch(() => {}); WL = null; } } catch (e) {} }

  /* ---------- afterwards: time on each slide, playback and transcript ---------- */
  let RV = null; // {p, run, i, audio, url}
  function reviewStop(){ const R = RV; RV = null; if (R) { try { if (R.audio) { R.audio.pause(); R.audio.removeAttribute("src"); } } catch (e) {} if (R.url) URL.revokeObjectURL(R.url); } }
  async function reviewOpen(pid, runId, reuse){
    const p = byId(pid); if (!p || !(p.runs || []).length) return;
    reviewStop();
    let el = reuse && reuse.isConnected ? reuse : document.getElementById("prStage");
    if (!el) { el = document.createElement("div"); el.id = "prStage"; el.className = "pr-stage"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); document.body.appendChild(el); document.body.classList.add("pr-on"); }
    el.classList.add("pr-light"); el.setAttribute("aria-label", "How your run went");
    const run = p.runs.find(r => r.id === runId) || p.runs[0];
    const worst = run.times.reduce((m, t, k) => t - run.budgets[k] > run.times[m] - run.budgets[m] ? k : m, 0);
    const R = RV = {p, run, i: worst, el, d: null};
    try { R.d = await deckFor(p); } catch (e) {}
    if (RV !== R) return;
    if (run.audio) { const b = await get("audio:" + run.id); if (RV !== R) return; if (b) { R.url = URL.createObjectURL(b); R.audio = new Audio(); R.audio.preload = "auto"; R.audio.src = R.url; R.audio.addEventListener("timeupdate", audioTick); R.audio.addEventListener("ended", () => { R.playing = false; paintAudio(); }); } }
    reviewDraw();
  }
  const segsOf = (run, i) => (run.seg || []).filter(g => g[0] === i);
  function reviewDraw(){
    const R = RV; if (!R) return;
    const {p, run} = R, n = run.times.length, d = run.total - run.target * 1000, max = Math.max(...run.times, ...run.budgets) * 1.05;
    const when = new Date(run.at), num = p.runs.length - p.runs.indexOf(run);
    const chip = Math.abs(d) <= 5000 ? ["ok", "Right on time"] : d > 0 ? [d > 30000 ? "over" : "warn", `${fmt(d)} over`] : ["ok", `${fmt(-d)} under`];
    R.el.innerHTML = `<div class="pr-rtop">
        <div class="pr-rtitle"><span class="pr-eyebrow">${esc(p.name)} · Run ${num} · ${esc(when.toLocaleDateString(undefined, {month: "short", day: "numeric"}))}, ${esc(when.toLocaleTimeString(undefined, {hour: "numeric", minute: "2-digit"}))}</span><b>${fmt(run.total)} <span>of ${fmt(run.target * 1000)} target</span></b></div>
        <span class="pr-chip c-${chip[0]}">${chip[1]}</span>
        ${p.runs.length > 1 ? `<label class="pr-runsel"><span class="sr">Run</span><select id="prRunSel">${p.runs.map((r, k) => `<option value="${esc(r.id)}" ${r === run ? "selected" : ""}>Run ${p.runs.length - k} · ${fmt(r.total)}</option>`).join("")}</select></label>` : ""}
        <button type="button" class="btn" data-act="pr-close">Close</button>
        <button type="button" class="btn primary" data-act="pr-again">Practise Again</button>
      </div>
      <div class="pr-rbody">
        <section class="pr-rbars" aria-label="Time on each slide">
          <div class="pr-rh"><b>Time on each slide</b><span class="mini"><i class="pr-aim-key"></i>aim</span></div>
          <div class="pr-rlist">${run.times.map((t, k) => `<button type="button" class="pr-rrow${k === R.i ? " on" : ""}" data-act="pr-rsel" data-i="${k}" aria-pressed="${k === R.i}"><span class="pr-rn">${k + 1}</span><span class="pr-rbar"><i class="t-${tone(t, run.budgets[k])}" style="width:${(t / max * 100).toFixed(1)}%"></i><em style="left:${(run.budgets[k] / max * 100).toFixed(1)}%"></em></span><span class="pr-rt">${fmt(t)}</span></button>`).join("")}</div>
          <p class="mini">Green is within a little of the aim, amber up to half again, red more.</p>
        </section>
        <section class="pr-rdetail" id="prDetail" aria-live="polite"></section>
      </div>`;
    const sel = R.el.querySelector("#prRunSel"); if (sel) sel.addEventListener("change", () => reviewOpen(p.id, sel.value, R.el));
    detailDraw();
  }
  function detailDraw(){
    const R = RV; if (!R) return; const box = R.el.querySelector("#prDetail"); if (!box) return;
    const {run} = R, i = R.i, t = run.times[i], b = run.budgets[i], diff = t - b;
    const segs = segsOf(run, i), words = (run.tr || []).filter(x => segs.some(g => x.t >= g[1] - 400 && x.t < g[2]));
    const said = words.map(x => x.s).join(" ");
    const wc = said.split(/\s+/).filter(Boolean).length, wpm = t > 5000 && wc ? Math.round(wc / (t / 60000)) : 0;
    const fill = (said.match(/\b(um+|uh+|er+|like|you know|basically)\b/gi) || []).length;
    box.innerHTML = `<div class="pr-dtop"><div class="pr-dpic" id="prDPic"></div>
        <div class="pr-dinfo"><span class="pr-eyebrow">Slide ${i + 1} of ${run.times.length}</span><b class="pr-dt t-${tone(t, b)}">${fmt(t)}${t ? `, ${Math.abs(diff) < 3000 ? "right on the aim" : diff > 0 ? `${fmt(diff)} over the aim` : `${fmt(-diff)} under the aim`}` : ", skipped"}</b><span class="mini">Aim ${fmt(b)}${wc ? ` · ${wc} words${wpm ? ` · ${wpm} a minute` : ""}${fill ? ` · ${fill} filler word${fill === 1 ? "" : "s"}` : ""}` : ""}</span></div></div>
      ${run.audio && RV.audio ? `<div class="pr-player"><button type="button" class="pr-pbtn" data-act="pr-aplay" aria-label="Play slide ${i + 1}">${IC.play}</button><div class="pr-pbar"><i id="prPBar"></i></div><span class="pr-ptime" id="prPTime">0:00 / ${fmt(t)}</span></div>` : run.audio ? `<p class="mini">The recording isn't on this device.</p>` : ""}
      <div class="pr-trans"><b>${run.audio || (run.tr || []).length ? "What you said" : "Transcript"}</b>${said ? `<p>${esc(said)}</p>` : `<p class="mini">${run.audio ? "No words were picked up on this slide." : "Turn on Record Me before your next run to see what you said on each slide."}</p>`}</div>`;
    const pic = box.querySelector("#prDPic"); if (pic && R.d) drawSlide(R.d, i, pic, pic.clientWidth || 260).catch(() => {});
    paintAudio();
  }
  // plays the selected slide's stretch of the run, across every visit to it
  function slidePos(R){ const segs = segsOf(R.run, R.i); if (!R.audio) return 0; const ct = R.audio.currentTime * 1000; let pos = 0; for (const g of segs) { if (ct >= g[2]) pos += g[2] - g[1]; else { if (ct > g[1]) pos += ct - g[1]; break; } } return pos; }
  function audioTick(){
    const R = RV; if (!R || !R.audio || !R.playing) return;
    const ct = R.audio.currentTime * 1000, segs = segsOf(R.run, R.i), g = segs.find(x => ct >= x[1] - 250 && ct < x[2]);
    if (!g) { const nx = segs.find(x => x[1] > ct); if (nx) R.audio.currentTime = nx[1] / 1000; else { R.audio.pause(); R.playing = false; R.done = true; } }
    paintAudio();
  }
  function paintAudio(){
    const R = RV; if (!R) return; const box = R.el.querySelector("#prDetail"); if (!box) return;
    const btn = box.querySelector(".pr-pbtn"), bar = box.querySelector("#prPBar"), tm = box.querySelector("#prPTime"), t = R.run.times[R.i] || 1;
    if (btn) { btn.innerHTML = R.playing ? IC.pause : IC.play; btn.setAttribute("aria-label", (R.playing ? "Pause" : "Play") + " slide " + (R.i + 1)); }
    const pos = R.done ? t : slidePos(R);
    if (bar) bar.style.width = Math.min(100, pos / t * 100) + "%";
    if (tm) tm.textContent = `${fmt(pos)} / ${fmt(t)}`;
  }
  function audioToggle(){
    const R = RV; if (!R || !R.audio) return;
    if (R.playing) { R.audio.pause(); R.playing = false; paintAudio(); return; }
    const segs = segsOf(R.run, R.i); if (!segs.length) return;
    const ct = R.audio.currentTime * 1000;
    if (R.done || !segs.some(g => ct >= g[1] && ct < g[2])) { R.audio.currentTime = segs[0][1] / 1000; R.done = false; }
    R.playing = true; R.audio.play().catch(() => { R.playing = false; paintAudio(); toast("Couldn't play the recording."); });
    paintAudio();
  }
  function reviewSelect(i){
    const R = RV; if (!R) return;
    if (R.audio) { R.audio.pause(); } R.playing = false; R.done = false; R.i = i;
    R.el.querySelectorAll(".pr-rrow").forEach((b, k) => { b.classList.toggle("on", k === i); b.setAttribute("aria-pressed", String(k === i)); });
    if (R.audio) { const segs = segsOf(R.run, i); if (segs.length) R.audio.currentTime = segs[0][1] / 1000; }
    detailDraw();
  }

  /* ---------- deleting ---------- */
  function delPres(id){
    const p = byId(id); if (!p) return;
    confirmSheet(`Delete ${p.name}?`, "Its slides, runs and recordings on this device are deleted. The original file isn't touched.", "Delete", () => {
      LIST = LIST.filter(x => x !== p); save(); del("deck:" + p.id); (p.runs || []).forEach(r => { if (r.audio) del("audio:" + r.id); });
      if (DECK && DECK.id === p.id) dropDeck();
      render(); toast(`Deleted ${p.name}`);
    });
  }

  /* ---------- actions and keys ---------- */
  hook("act", (act, el, id) => {
    const d = (el && el.dataset) || {};
    switch (act) {
      case "pr-view": if (dlg.open) dlg.close(); ui.tab = "flashcards"; ui.deckId = null; ui.fc = null; ui.qzOpen = null; if (typeof rvSet === "function") rvSet("present"); render(); window.scrollTo(0, 0); return true;
      case "pr-new": newSheet(d.course || ""); return true;
      case "pr-gslides": fromGoogle(); return true;
      case "pr-create": create(); return true;
      case "pr-open": { const p = byId(id); if (!p) return true; if ((p.runs || []).length) reviewOpen(p.id); else stageOpen(p.id); return true; }
      case "pr-practise": stageOpen(id); return true;
      case "pr-del": delPres(id); return true;
      case "pr-tgt": {
        const delta = Number(d.d) || 0;
        if (ADD && dlg.open && dlg.querySelector(".pr-sheet")) { const n = ADD.deck ? ADD.deck.n : 5; ADD.target = Math.max(30, Math.min(7200, (ADD.target || n * 60) + delta)); drawNew(); return true; }
        if (STG && !STG.started) { const p = STG.p; p.target = Math.max(30, Math.min(7200, p.target + delta)); p.updated = Date.now(); save(); STG.b = budgets(p, STG.d); const top = STG.el.querySelector(".pr-clock span"); if (top) top.textContent = "of " + fmt(p.target * 1000); paintReady(); paint(); }
        return true;
      }
      case "pr-split": {
        if (ADD && dlg.open && dlg.querySelector(".pr-sheet")) { ADD.split = id === "notes" ? "notes" : "even"; drawNew(); return true; }
        if (STG && !STG.started) { STG.p.split = id === "notes" ? "notes" : "even"; save(); STG.b = budgets(STG.p, STG.d); paintReady(); paint(); }
        return true;
      }
      case "pr-gfresh": if (STG && !STG.started) refreshGoogle(STG.p); return true;
      case "pr-play": play(); return true;
      case "pr-pp": if (STG) { if (STG.running) pause(); else play(); } return true;
      case "pr-next": next(); return true;
      case "pr-prev": if (STG && STG.started) go(STG.i - 1); else if (STG) go(STG.i - 1); return true;
      case "pr-go": go(Number(d.i) || 0); return true;
      case "pr-end": finish(); return true;
      case "pr-close": stageClose(); return true;
      case "pr-again": { const p = RV && RV.p; reviewStop(); if (p) stageOpen(p.id); return true; }
      case "pr-rsel": reviewSelect(Number(d.i) || 0); return true;
      case "pr-aplay": audioToggle(); return true;
    }
    return false;
  });
  window.addEventListener("keydown", e => {
    if (!document.getElementById("prStage") || dlg.open) return;
    const tg = e.target, typing = tg && (tg.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName));
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (RV) {
      if (e.key === "Escape") { e.preventDefault(); stageClose(); }
      else if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); reviewSelect(Math.min(RV.run.times.length - 1, RV.i + 1)); }
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); reviewSelect(Math.max(0, RV.i - 1)); }
      else if (e.key === " " && RV.audio) { e.preventDefault(); audioToggle(); }
      return;
    }
    const S = STG; if (!S || !S.d) return;
    const k = e.key;
    if (k === "ArrowRight" || k === "PageDown" || k === "Enter" || (k === " " && !(tg && tg.tagName === "BUTTON"))) { e.preventDefault(); next(); }
    else if (k === "ArrowLeft" || k === "PageUp" || k === "Backspace") { e.preventDefault(); go(S.i - 1); }
    else if (k === "p" || k === "P" || k === "k" || k === "K") { e.preventDefault(); if (S.running) pause(); else if (S.started) play(); }
    else if (k === "Escape") { e.preventDefault(); if (S.started) finish(); else stageClose(); }
  }, true);
  let rz = 0;
  window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { if (STG && STG.d) drawCur(); else if (RV) detailDraw(); }, 150); });

  // Studyboard Pro's list of features: recording a practice run
  if (window.SBPRO && SBPRO.addFeature) SBPRO.addFeature({id: "present", name: "Presentation Practice Recording", free: "Timing on Every Slide", pro: "Recording and Transcripts", where: "Review, Presentations", icon: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/>'});

  window.SBPRESENT = {listHtml, open: stageOpen, add: newSheet, list: () => LIST.slice(), loaded: () => LOADED};
})();
