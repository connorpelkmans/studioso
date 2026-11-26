/* ===== 01-ai-device.js: AI that runs on the student's own device, with nothing to set up.
   Chrome: the built-in Prompt API (window.LanguageModel, Gemini Nano; desktop Chrome 148 and later).
   Elsewhere (Edge, Safari, the desktop app, computers Chrome's model doesn't run on): Google's Gemma, run in the browser by WebLLM
   (vendor/webllm-0.2.89) on the graphics chip, downloaded once only after the student agrees.
   iPhone and iPad app: Apple's on-device model, through the StudyboardOnDeviceAI plugin (ios-wrapper/native/StudyboardOnDeviceAI.swift).
   Used only when the student has no AI key and no Studyboard AI Pro (aiCfg in 01-ai.js). Nothing leaves the device, so there's no
   consent to ask for, no key and no cost. These models are small, so the study set pipeline gives them short sections, examples,
   and a checking pass (01-ai.js: aiDevCheckCards, aiDevCheckQuiz). ===== */
// var, not const: aiCfg can ask about it while the bundle is still loading
var DEVAI = {kind: "", status: "", images: false, ctx: 0, progress: 0, warm: null, probing: null};
const DEV_LANGS = ["en", "es", "de", "fr", "ja"];
const devLangs = () => { const l = String(navigator.language || "en").slice(0, 2).toLowerCase(); return l !== "en" && DEV_LANGS.includes(l) ? ["en", l] : ["en"]; };
const devOpts = img => ({expectedInputs: [{type: "text", languages: devLangs()}].concat(img ? [{type: "image"}] : []), expectedOutputs: [{type: "text", languages: devLangs()}]});
// Edge has the same built-in AI interface as Chrome (with Microsoft's own model): it's named as Edge's
const devBrowser = () => { try { const b = navigator.userAgentData && navigator.userAgentData.brands; if (b && b.some(x => /Microsoft Edge/i.test(x.brand))) return "Edge"; } catch (e) {} return /\bEdg\//.test(navigator.userAgent || "") ? "Edge" : "Chrome"; };
// the exact model, for AI Features ("which AI am I using?")
const devModel = () => DEVAI.kind === "litert" ? "Google's Gemma 4 E4B" : DEVAI.kind === "webllm" ? (/gemma-4-E2B/i.test((DEVAI.web || {}).id || "") ? "Google's Gemma 4 E2B" : /gemma3-1b/i.test((DEVAI.web || {}).id || "") ? "Google's Gemma 3 1B" : "Google's Gemma") : DEVAI.kind === "apple" ? "Apple's on-device model" : DEVAI.kind ? (devBrowser() === "Edge" ? "Microsoft's Phi-4-mini" : "Google's Gemini Nano") : "";
// the name students see: Studyboard AI 16GB (Gemma 4 E4B), Studyboard AI 8GB (Chrome's or Edge's built-in AI, or Gemma 4 E2B),
// Studyboard AI Lite (Gemma 3 1B, for less memory), Apple Intelligence in the iPhone app
const devTier = () => DEVAI.kind === "litert" ? "16" : DEVAI.kind === "webllm" && /gemma3-1b/i.test((DEVAI.web || {}).id || "") ? "lite" : DEVAI.kind && DEVAI.kind !== "apple" ? "8" : "";
const devLabel = () => DEVAI.kind === "apple" ? "Apple Intelligence" : ({"16": "Studyboard AI 16GB", "8": "Studyboard AI 8GB", lite: "Studyboard AI Lite"})[devTier()] || "Studyboard AI";
// Phones and tablets: only the small model, and only with enough memory. An iPhone's browser doesn't say how much it has (and the
// iPhone app uses Apple's own AI), so Safari on an iPhone gets none; an iPad gets the small one
const devPhone = () => { try { if (navigator.userAgentData && navigator.userAgentData.mobile) return true; } catch (e) {} return /iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent || ""); };
const devTablet = () => /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent || "") || (/Macintosh/.test(navigator.userAgent || "") && (navigator.maxTouchPoints || 0) > 1);
const devUsable = () => ["available", "downloadable", "downloading"].includes(DEVAI.status);
// Tests opt in (the test browser may or may not have the model): window.__SB_DEVICE_AI_TEST
const devAllowed = () => !window.__SB_TEST || !!window.__SB_DEVICE_AI_TEST;
let devPluginReg = null;
function devNative(){
  try {
    const C = window.Capacitor; if (!C || !(C.isNativePlatform && C.isNativePlatform())) return null;
    if (C.isPluginAvailable && !C.isPluginAvailable("StudyboardOnDeviceAI")) return null;
    if (C.Plugins && C.Plugins.StudyboardOnDeviceAI) return C.Plugins.StudyboardOnDeviceAI;
    if (!devPluginReg && typeof C.registerPlugin === "function") devPluginReg = C.registerPlugin("StudyboardOnDeviceAI");
    return devPluginReg;
  } catch (e) { return null; }
}
async function devProbe(){
  if (DEVAI.probing) return DEVAI.probing;
  DEVAI.probing = (async () => {
    const before = DEVAI.status;
    try {
      // (after the rest of the app has loaded: the first probe starts while it's still being read)
      await null;
      if (!devAllowed()) { DEVAI.status = ""; return; }
      // Gemma 4 E4B, once it's downloaded on a computer that runs it, is used ahead of the rest
      if (!e4bOff && devLs.get(E4B_READY) === "1" && devLs.get(E4B_FAIL) !== "1" && await e4bFits() && await e4bReadyNow(false)) return;
      const N = devNative();
      if (N) {
        const r = await N.availability();
        DEVAI.kind = "apple"; DEVAI.status = r && r.status === "available" ? "available" : r && r.status === "downloading" ? "downloading" : "unavailable";
        DEVAI.images = !!(r && r.images); DEVAI.ctx = Number(r && r.contextSize) || 4096; DEVAI.reason = (r && r.reason) || "";
      } else if (typeof self !== "undefined" && "LanguageModel" in self && window.isSecureContext !== false) {
        DEVAI.kind = "chrome"; DEVAI.status = await self.LanguageModel.availability(devOpts(false));
        try { DEVAI.images = (await self.LanguageModel.availability(devOpts(true))) !== "unavailable"; } catch (e) { DEVAI.images = false; }
        // Chrome's isn't usable here: Studyboard's own (WebLLM) if this computer can run it; else the reason for Chrome's
        if (!devUsable() && await webProbe()) {} else devNoteState();
      } else if (!(await webProbe())) DEVAI.status = "";
    } catch (e) { DEVAI.status = "unavailable"; }
    finally {
      // finished downloading while this probe was running: it stays the one used
      if (DEVAI.e4b === "ready") { DEVAI.kind = "litert"; DEVAI.status = "available"; DEVAI.ctx = E4B.ctx; DEVAI.images = false; DEVAI.why = ""; }
      DEVAI.probing = null; if (DEVAI.status !== before) { try { scheduleRender(); } catch (e) {} } }
  })();
  return DEVAI.probing;
}
devProbe().then(() => { if (DEVAI.kind !== "litert" && devLs.get(E4B_FAIL) !== "1") e4bCheck(); });
document.addEventListener("visibilitychange", () => { if (!document.hidden && DEVAI.status && DEVAI.status !== "available") devProbe(); });

/* Why Chrome's built-in AI isn't ready, for the student. Chrome doesn't say why it reports the model missing, so Studyboard
   remembers when it was last ready on this device. Ready before and missing now is almost always Chrome freeing disk space (it
   removes the model when less than 10 GB is free); never ready means this computer can't run it (22 GB of free space and a graphics
   card with more than 4 GB of memory, or 16 GB of RAM). DEVAI.why: "removed" (it downloads again on next use), "removed-full" (no
   room to download it again), "cant" (never could), or "" */
const DEV_HAD = "studyboard:devAIHad", DEV_SAID = "studyboard:devAISaid";
const devLs = {get: k => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }};
function devNoteState(){
  if (DEVAI.kind !== "chrome") { DEVAI.why = ""; return; }
  if (DEVAI.status === "available") { devLs.set(DEV_HAD, new Date().toISOString().slice(0, 10)); DEVAI.why = ""; return; }
  const had = !!devLs.get(DEV_HAD);
  DEVAI.why = had && DEVAI.status === "downloadable" ? "removed" : had && DEVAI.status === "unavailable" ? "removed-full" : DEVAI.status === "unavailable" ? "cant" : "";
  // said once, the day it's noticed, to a student who had been using it (not on every visit)
  if (had && DEVAI.why && devLs.get(DEV_SAID) !== devLs.get(DEV_HAD)) {
    devLs.set(DEV_SAID, devLs.get(DEV_HAD));
    try { if (!(state.settings && state.settings.ai && aiHeldKeys && Object.values(aiHeldKeys()).some(Boolean))) toast(devWhyText(), null, {label: "AI Features", fn: () => aiSetupSheet(false)}); } catch (e) {}
  }
}
function devWhyText(){
  return DEVAI.why === "removed" ? "Chrome removed its built-in AI from this computer to free up disk space. It downloads again (once) the next time you use an AI feature."
    : DEVAI.why === "removed-full" ? "Chrome removed its built-in AI from this computer to free up disk space, and can't download it again until at least 22 GB is free. Free up some space, or add a free AI key in AI Features."
    : DEVAI.why === "cant" ? "This computer can't run Chrome's built-in AI: it needs 22 GB of free disk space and a graphics card with more than 4 GB of memory, or 16 GB of RAM. You can still use AI with a free key."
    : "";
}

/* The first time, Chrome downloads its model (once, for every site). Chrome only starts that download from a click, so a click on
   anything AI starts it, and the request that follows waits for it with a progress line. */
const DEV_AI_ACT = /(^|-)ai(-|$)|hint|explain|first-deck|^fd-|^cp-|companion|quiz|^lec-|^wb-/;
// While Chrome downloads its model (one time), a pill at the bottom says so with the progress, whatever button started it, so an
// answer that's waiting on the download doesn't just look slow
function devDlPill(p){
  let el = document.getElementById("devDlPill");
  if (p == null || p >= 1) { if (el) { el.classList.remove("show"); setTimeout(() => { if (el && !el.classList.contains("show")) el.remove(); }, 400); } return; }
  if (!el) { el = document.createElement("div"); el.id = "devDlPill"; el.className = "toast sync-pill"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite"); }
  const h = toastHost(); if (el.parentNode !== h) h.appendChild(el);
  el.textContent = `${devBrowser()} is downloading its free AI (one time only)${p > 0 ? `: ${Math.round(p * 100)}%` : "…"} Your answer comes once it's ready.`;
  requestAnimationFrame(() => el.classList.add("show"));
}
function devWarm(){
  if (DEVAI.kind !== "chrome" || DEVAI.warm || !["downloadable", "downloading"].includes(DEVAI.status)) return DEVAI.warm;
  try { if (navigator.userActivation && !navigator.userActivation.isActive) return null; } catch (e) {}
  devDlPill(DEVAI.progress || 0);
  DEVAI.warm = self.LanguageModel.create(Object.assign(devOpts(false), {monitor(m){ m.addEventListener("downloadprogress", e => { DEVAI.progress = Number(e.loaded) || 0; devDlPill(DEVAI.progress < 1 ? DEVAI.progress : null); try { fire("device-ai-progress", DEVAI.progress); } catch (x) {} }); }}))
    .then(s => { try { s.destroy(); } catch (e) {} DEVAI.status = "available"; DEVAI.progress = 1; devDlPill(null); devNoteState(); try { scheduleRender(); } catch (e) {} return true; })
    .catch(e => { DEVAI.warm = null; devDlPill(null); return false; });
  return DEVAI.warm;
}
document.addEventListener("click", e => {
  if (!e.isTrusted || DEVAI.kind !== "chrome" || DEVAI.status === "available" || !devUsable()) return;
  const el = e.target && e.target.closest && e.target.closest("[data-act]"); if (!el) return;
  try { const c = aiCfg(); if (c.provider !== "device") return; } catch (x) { return; }
  if (DEV_AI_ACT.test(el.dataset.act || "") && (devLs.get(DEV_OK) || devLs.get(DEV_HAD))) devWarm();
}, true);

// base64 picture (from a part's inline_data) to a Blob, for Chrome
const devBlob = (b64, type) => { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return new Blob([u], {type}); };
// Rough tokens for text these models read (about 3.3 characters each, a little high on purpose)
const devTokens = t => Math.ceil(String(t || "").length / 3.3);
// Shorten the longest text parts until the request fits, keeping each one's start; says whether anything was cut
function devFit(parts, room){
  const texts = parts.filter(p => p && typeof p.text === "string");
  let over = texts.reduce((n, p) => n + devTokens(p.text), 0) - room, cut = false;
  while (over > 0) {
    const big = texts.reduce((a, p) => devTokens(p.text) > devTokens(a.text) ? p : a, texts[0]); if (!big || devTokens(big.text) < 200) break;
    const keep = Math.max(600, Math.floor((devTokens(big.text) - over - 40) * 3.3));
    const t = big.text.slice(0, keep), end = Math.max(t.lastIndexOf(". "), t.lastIndexOf("\n"));
    big.text = (end > keep * 0.6 ? t.slice(0, end + 1) : t) + "\n[…the rest was left out to fit]"; cut = true;
    over = texts.reduce((n, p) => n + devTokens(p.text), 0) - room;
  }
  return cut;
}
// The iPhone plugin gets each object's field order spelled out (Swift dictionaries have none, and the order is the order the model
// writes in: a card's source sentence before the card)
const devOrdered = s => { if (!s || typeof s !== "object") return s; if (Array.isArray(s)) return s.map(devOrdered);
  const o = Object.assign({}, s); if (o.properties) { o.propertyOrder = Object.keys(o.properties); o.properties = Object.fromEntries(Object.entries(o.properties).map(([k, v]) => [k, devOrdered(v)])); }
  if (o.items) o.items = devOrdered(o.items); return o; };
const DEV_TAIL = "\n\nAnswer with JSON only, in exactly the requested format. Finish every sentence you start. Everything you write must be suitable for a school student.";
async function devLookup({system, parts, search, urlContext, signal, onStatus}){
  const text = parts.filter(p => p && typeof p.text === "string").map(p => p.text).join("\n"), out = [];
  if (urlContext) {
    const urls = [...new Set((text.match(/https?:\/\/[^\s"'<>)\]]+/g) || []).map(u => u.replace(/[.,;:]+$/, "")))].slice(0, 3);
    for (const u of urls) {
      if (onStatus) onStatus("Reading " + u.replace(/^https?:\/\//, "").slice(0, 60) + "…");
      try { const r = await devPageText(u, signal); if (r && r.text && r.text.length > 200) out.push(`[Page] ${r.title || u} (${u})\n${String(r.text).slice(0, 6000)}`); } catch (e) { if (signal && signal.aborted) throw e; }
    }
  }
  if (search && window.SBTRUTH) {
    let q = "";
    try {
      const r = await devRun({system: "You write web search queries. Reply with JSON: {\"query\": \"a short search query of 2 to 8 words that finds what the request needs\"}.", parts: [{text: `Instructions the request came with: ${String(system || "").slice(0, 600)}\n\nThe request:\n${text.slice(0, 2500)}`}], schema: {type: "OBJECT", properties: {query: {type: "STRING"}}, required: ["query"]}, maxTokens: 120, temperature: 0, signal});
      q = String((r.data || {}).query || "").slice(0, 120);
    } catch (e) { if (signal && signal.aborted) throw e; }
    if (!q) q = text.replace(/\s+/g, " ").slice(-160);
    if (onStatus) onStatus(`Looking up "${q}"…`);
    const R = await SBTRUTH.research(q, {noPlan: true, max: 5}).catch(() => ({list: []}));
    if (R.list && R.list.length) out.push(SBTRUTH.webText(R.list));
  }
  return out.length ? "WEB SOURCES (found for this request):\n\n" + out.join("\n\n") : "";
}
// One request at a time: these models answer one thing at a time anyway, and progress lines stay true
let devQueue = Promise.resolve();
// (no request holds the line longer than a few minutes, whatever happens inside it)
function devCall(o){ const run = devQueue.then(() => devRun(o)); devQueue = Promise.race([run.catch(() => {}), new Promise(r => setTimeout(r, DEV_MAX_MS + 30000))]); return run; }
async function devRun({system, parts, schema, maxTokens, temperature, signal, search, urlContext, onStatus, onPartial, auto}){
  if (signal && signal.aborted) throw aiErr("aborted", "Stopped.");
  const L = devLabel();
  // The web, for a model that can't browse: pages named in the request are read by Studyboard's page reader, and a search is
  // looked up on Wikipedia (98-truth.js) from a short query the model writes first. What's found goes in as sources.
  if (search || urlContext) {
    const found = await devLookup({system, parts, search, urlContext, signal, onStatus});
    if (!found) throw aiErr("device-web", `${L} couldn't find anything on the web for that. Studyboard AI Pro or an AI key in Settings, AI Features can search the whole web.`);
    parts = parts.concat({text: found});
    system = String(system || "") + " Use the WEB SOURCES given (and say where a fact comes from); if they don't answer it, say so instead of guessing.";
  }
  if (parts.some(p => p && p.file_data)) throw aiErr("device-files", `${L} can't watch videos. Studyboard AI Pro or an AI key in Settings, AI Features can.`);
  // Photos and PDFs: their words are read on this device first (01-ocr.js), so the model gets text
  parts = await devReadParts(parts, {onStatus, signal, auto});
  const pics = parts.filter(p => p && p.inline_data);
  parts = parts.map(p => p && typeof p.text === "string" ? {text: p.text} : p);
  const sys = String(system || "") + DEV_TAIL, json = toJsonSchema(schema || {type: "OBJECT"});
  const out = Math.min(Number(maxTokens) || 1500, 1800);
  if (DEVAI.kind === "apple") return devApple({sys, parts, json: devOrdered(json), out, temperature, signal, auto});
  if (DEVAI.kind === "litert") {
    try { return await devLite({sys, parts, json, out: Math.min(Number(maxTokens) || 1500, 2000), temperature, signal, onStatus, onPartial}); }
    catch (e) {
      // E4B that never got a word out (or wouldn't start): this session goes back to the AI the computer had (Chrome's built-in
      // AI, say), and this request is answered with it, so the student isn't left waiting. It's tried again next time Studyboard opens.
      if (!e || !/^(device-stall|device-failed)$/.test(String(e.code || "")) || e.wrote || (signal && signal.aborted)) throw e;
      e4bOff = true; e4bStop(); DEVAI.kind = ""; DEVAI.status = ""; await devProbe();
      // both can be on this device, so say which is which: the stronger one (E4B) and what answers instead (its smaller one, or the browser's or Apple's)
      try { toast(DEVAI.status === "available" && DEVAI.kind !== "litert" ? "Studyboard's stronger on-device AI (Gemma 4 E4B) didn't respond, so for now it's using " + (DEVAI.kind === "webllm" ? "its smaller on-device AI (" + devModel().replace(/^Google's /, "") + ")" : devLabel()) + ". It'll try the stronger one again next time you open Studyboard."
        : "Studyboard's stronger on-device AI (Gemma 4 E4B) didn't respond on this computer. It'll try again next time you open Studyboard."); } catch (x) {}
      if (DEVAI.status !== "available" || DEVAI.kind === "litert") throw e;
      if (DEVAI.kind === "apple") return devApple({sys, parts, json: devOrdered(json), out, temperature, signal, auto});
      if (DEVAI.kind === "webllm") return devWeb({sys, parts, json, out, temperature, signal, onStatus, auto});
      return devChrome({sys, parts, json, out, signal, onStatus, onPartial, auto, pics: pics.length > 0});
    }
  }
  if (DEVAI.kind === "webllm") return devWeb({sys, parts, json, out, temperature, signal, onStatus, auto});
  return devChrome({sys, parts, json, out, signal, onStatus, onPartial, auto, pics: pics.length > 0});
}
/* A photo or PDF for the AI on this device: a PDF with real text gives its text; a photo or scanned page has its words read (Apple's
   Vision on the iPhone, Tesseract.js elsewhere). A picture with no words at all (a diagram) stays a picture only where the model can
   see pictures; otherwise the student is told plainly. Too hard to read (most often handwriting on a computer): said plainly too,
   rather than making cards from misread words. */
const DEV_OCR_SAID = "Words read from a picture on this device";
async function devReadParts(parts, {onStatus, signal, auto}){
  if (!parts.some(p => p && p.inline_data)) return parts;
  const L = devLabel(), out = [];
  for (const p of parts) {
    const d = p && p.inline_data, mime = d && (d.mime_type || "");
    if (!d) { out.push(p); continue; }
    if (auto) throw aiErr("auto-off", "Reading pictures isn't done in the background.");
    if (mime === "application/pdf") {
      const u8 = Uint8Array.from(atob(d.data), c => c.charCodeAt(0)), txt = await aiPdfText(u8).catch(() => "");
      if (txt && txt.replace(/\s+/g, " ").length > 200) { out.push({text: txt}); continue; }
      let r;
      try { r = await SBOCR.readPdf(u8, {onStatus, signal}); }
      catch (e) { if (e && (e.code === "aborted" || e.code === "ocr-failed")) throw e; throw Object.assign(aiErr("device-files", `${L} couldn't open this PDF. It may be damaged or locked.`), {detail: String(e && e.message || e)}); }
      if (r.text.length < 30 || r.conf < OCR.unreadable) throw devUnreadable(r, "file");
      out.push({text: `${DEV_OCR_SAID} (a scanned PDF${r.conf < OCR.hard ? "; parts were hard to read, so a few words may be wrong" : ""}${r.cut ? `; only its first ${r.pages.length} of ${r.total} pages` : ""}):\n\n${r.text}`});
      continue;
    }
    if (!/^image\//.test(mime)) throw aiErr("device-files", `${L} can't read this kind of file. Studyboard AI Pro or an AI key in Settings, AI Features can.`);
    if (onStatus) onStatus("Reading the words in your picture on this device…");
    const r = await SBOCR.readImage(d, {signal, onProgress: x => onStatus && onStatus(`Reading the words in your picture on this device… ${Math.round(x * 100)}%`)});
    if (r.text.length >= 15 && r.conf >= OCR.unreadable) { if (onStatus) onStatus(`Read the words in your picture. ${devLabel()} is writing it up now…`); out.push({text: `${DEV_OCR_SAID}${r.conf < OCR.hard ? " (parts were hard to read, so a few words may be wrong)" : ""}:\n\n${r.text}`}); continue; }
    // no readable words: the model looks at the picture itself if it can (a diagram), else the student is told
    if (DEVAI.images && r.text.length < 15) { out.push(p); continue; }
    throw devUnreadable(r, "picture");
  }
  return out;
}
// No AI can run on this device here: why, and what would (said in AI Features, above the key choices)
// Whether to say devNoneText: no AI can run here, and it's the phone or the browser (not Chrome's model) that's the reason
function devNoneShow(){
  try { if (!devAllowed() || devUsable() || DEVAI.kind === "webllm" || devNative()) return false; } catch (e) { return false; }
  const gpu = !!(navigator.gpu || (window.__SB_TEST && window.__SB_GPU_STUB));
  return devPhone() || !gpu || !(DEVAI.kind === "chrome" && DEVAI.why);
}
function devNoneText(){
  const gpu = !!(navigator.gpu || (window.__SB_TEST && window.__SB_GPU_STUB));
  if (devPhone()) return "Free AI that runs on your own device isn't available in this phone's browser. On a computer, Chrome, Edge and Safari run it for free; on iPhone, the Studyboard app uses Apple Intelligence. A free key below works everywhere.";
  if (!gpu) return "This browser can't run AI on your computer (it doesn't support WebGPU). An up-to-date Chrome, Edge or Safari can, for free and without a key. Or add a free key below.";
  return "This computer's graphics chip doesn't have enough memory to run free AI here. A free key below works instead.";
}
function devUnreadable(r, what){
  const L = devLabel(), hand = r.engine === "tesseract" && r.text.length >= 15;
  return aiErr("device-unreadable", r.text.length < 15
    ? `There are no words in that ${what} that this device can read. ${L} works from text, so diagrams and drawings need Studyboard AI Pro or an AI key in Settings, AI Features.`
    : hand ? `That ${what} was too hard to read on this computer (handwriting usually is). Try typed notes or a sharper, brighter photo; the Studyboard iPhone app reads handwriting, and so do Studyboard AI Pro and an AI key.`
    : `That ${what} was too hard to read. Try a sharper, brighter photo taken straight on.`);
}
/* ---------- Studyboard's own on-device AI: Gemma in the browser (WebLLM) ----------
   For computers where Chrome's built-in AI isn't there: other browsers, the desktop app, and computers Chrome's model doesn't run on.
   It runs on the graphics chip (WebGPU) in a worker under its own narrow policy (_headers), and nothing leaves the computer. Its
   model is downloaded once, only after the student agrees (unlike Chrome's, which Chrome manages), and kept by the browser.
   Gemma 4 E2B (Apache 2.0, about 2.8 GB) where the computer can hold it; Gemma 3 1B (about 0.6 GB) on smaller ones, or if the bigger
   one doesn't fit after all (remembered). Both read up to 4,096 tokens at a time, so requests are fitted to that, as for Apple's. */
const WEBLLM_DIR = "vendor/webllm-0.2.89/", WEB_HF = "https://huggingface.co/mlc-ai/";
const WEB_MODELS = {
  big16: {id: "gemma-4-E2B-it-q4f16_1-MLC", lib: "gemma-4-E2B-it-q4f16_1_cs512-webgpu.wasm", gb: 2.8, name: "Gemma 4", vram: 3387.37, extra: {model_manifest: "mlc-model-manifest.json", buffer_size_required_bytes: 201326592, required_features: ["shader-f16"]}},
  big32: {id: "gemma-4-E2B-it-q4f32_1-MLC", lib: "gemma-4-E2B-it-q4f32_1_cs512-webgpu.wasm", gb: 2.8, name: "Gemma 4", vram: 3862.72, extra: {model_manifest: "mlc-model-manifest.json", buffer_size_required_bytes: 201326592}},
  small: {id: "gemma3-1b-it-q4f16_1-MLC", lib: "gemma3-1b-it-q4f16_1_cs512-webgpu.wasm", gb: 0.6, name: "Gemma 3", vram: 711.07, small: true, extra: {required_features: ["shader-f16"]}, ov: {sliding_window_size: -1}}
};
/* Studyboard's own trained models (ml/README.md): when one is set here, it replaces the stock model of the same size. It has the
   same architecture, so the same WebLLM library above runs it; only its weights (on Hugging Face) differ. Each entry:
   {id: "studyboard-gemma3-1b-it-q4f16_1-MLC", hf: "https://huggingface.co/<user>/", gb, vram}. null keeps the stock model. */
const WEB_CUSTOM = {big16: null, big32: null, small: null};
Object.entries(WEB_CUSTOM).forEach(([k, c]) => { if (c && c.id && WEB_MODELS[k]) Object.assign(WEB_MODELS[k], c, {custom: true}); });
const webHf = m => m.hf || WEB_HF;
const WEB_SMALL = "studyboard:webAISmall", WEB_DECLINED = "studyboard:webAIDeclined", WEB_READY = "studyboard:webAIReady";
const webAbs = f => new URL(WEBLLM_DIR + f, location.href).href;
const webGpu = () => (window.__SB_TEST && window.__SB_GPU_STUB) || navigator.gpu || null;
const webAppConfig = () => ({useIndexedDBCache: false, model_list: Object.values(WEB_MODELS).map(m => Object.assign({model: webHf(m) + m.id, model_id: m.id, model_lib: webAbs("libs/" + m.lib),
  vram_required_MB: m.vram, low_resource_required: !!m.small, overrides: Object.assign({context_window_size: 4096}, m.ov || {})}, m.extra))});
// Which model this computer can hold: the graphics chip's limits and the memory the browser reports (it says 8 for 8 GB or more)
async function webProbe(){
  try {
    const gpu = webGpu(); if (!gpu || !devAllowed() || devNative()) return false;
    const ad = await gpu.requestAdapter(); if (!ad) return false;
    const f16 = !!(ad.features && ad.features.has && ad.features.has("shader-f16")), lim = ad.limits || {}, told = Number(navigator.deviceMemory) || 0, mem = told || 8;
    const phone = devPhone(), tablet = devTablet();
    if (phone && (!told || told < 6)) return false;
    const fitsBig = !phone && !tablet && mem >= 8 && (lim.maxBufferSize || 0) >= 201326592 && (lim.maxStorageBufferBindingSize || 0) >= 134217728 && devLs.get(WEB_SMALL) !== "1";
    const m = fitsBig ? (f16 ? WEB_MODELS.big16 : WEB_MODELS.big32) : f16 ? WEB_MODELS.small : null;
    if (!m) return false;
    DEVAI.kind = "webllm"; DEVAI.web = m; DEVAI.ctx = 4096; DEVAI.images = false; DEVAI.why = "";
    DEVAI.status = devLs.get(WEB_READY) === m.id && await webCached(m) ? "available" : devLs.get(WEB_DECLINED) === "1" ? "declined" : "downloadable";
    return true;
  } catch (e) { return false; }
}
// Whether the model's files are already in the browser's cache (WebLLM keeps them in Cache Storage)
async function webCached(m){
  try { if (window.__SB_TEST && window.__SB_WEBLLM_STUB) return !!window.__SB_WEBLLM_STUB.cached; const c = await caches.open("webllm/model"); return !!(await c.match(`${webHf(m)}${m.id}/resolve/main/mlc-chat-config.json`)); } catch (e) { return false; }
}
// Asked once, before anything is downloaded: download it, use a key instead, or not now (remembered; AI Features offers it again)
function webAsk(m){
  return new Promise(done => {
    const d = document.createElement("dialog"); d.className = "ai-consent web-ai-ask"; d.setAttribute("aria-labelledby", "webAskT");
    d.innerHTML = `<div class="sheet"><div class="sheet-head"><h2 id="webAskT">Turn On Free AI?</h2></div>
      <div class="sheet-body"><p style="margin:0">Studyboard uses ${esc(m.name)}, Google's free AI. It downloads once (about ${m.gb} GB, Wi-Fi recommended), then runs on this computer. It's private: what you add stays here.</p></div>
      <div class="sheet-foot"><button type="button" class="btn" data-key>Use an AI Key Instead</button><span class="spacer"></span><button type="button" class="btn" data-no>Not Now</button><button type="button" class="btn primary" data-yes>Turn On</button></div></div>`;
    const fin = v => { try { d.close(); } catch (e) {} d.remove(); done(v); };
    d.addEventListener("cancel", e => { e.preventDefault(); fin("no"); });
    d.querySelector("[data-yes]").addEventListener("click", () => fin("yes"));
    d.querySelector("[data-no]").addEventListener("click", () => fin("no"));
    d.querySelector("[data-key]").addEventListener("click", () => fin("key"));
    document.body.appendChild(d); d.showModal();
  });
}
let webEng = null, webIdle = null;
const webErrText = e => String((e && (e.message || e)) || "");
const webTooBig = e => /out of memory|device (was )?lost|OOM|exceed|maxBufferSize|maxStorageBuffer|shader-f16|not supported by the adapter|Failed to allocate|allocation/i.test(webErrText(e));
async function webLoad(m, onStatus){
  const lib = window.__SB_TEST && window.__SB_WEBLLM_STUB ? window.__SB_WEBLLM_STUB : await import(webAbs("web-llm.js"));
  const worker = lib.stubWorker ? null : new Worker(webAbs("worker.js?v=2"), {type: "module"});
  const say = r => { if (!onStatus) return; const p = Number(r && r.progress) || 0; onStatus(p > 0 && p < 1 ? `Downloading free AI to this computer (one time only): ${Math.round(p * 100)}%` : "Starting the AI on this computer…"); };
  try { return await lib.CreateWebWorkerMLCEngine(worker, m.id, {appConfig: webAppConfig(), initProgressCallback: say}); }
  catch (e) { try { worker && worker.terminate(); } catch (x) {} throw e; }
}
async function webEngine(onStatus){
  clearTimeout(webIdle);
  if (!webEng) webEng = (async () => {
    let m = DEVAI.web;
    try { const eng = await webLoad(m, onStatus); devLs.set(WEB_READY, m.id); DEVAI.status = "available"; return eng; }
    catch (e) {
      // too big for this computer after all: the small model, from now on
      if (!m.small && webTooBig(e) && WEB_MODELS.small) { devLs.set(WEB_SMALL, "1"); m = DEVAI.web = WEB_MODELS.small; if (onStatus) onStatus("That model is too big for this computer, so Studyboard is getting a smaller one…");
        const eng = await webLoad(m, onStatus); devLs.set(WEB_READY, m.id); DEVAI.status = "available"; return eng; }
      throw e;
    }
  })().catch(e => { webEng = null; throw e; });
  return webEng;
}
// unloaded after a few idle minutes, so the graphics memory is free again (it reloads from the cache in seconds)
function webRest(){ clearTimeout(webIdle); webIdle = setTimeout(async () => { const e = webEng; webEng = null; try { (await e).unload(); } catch (x) {} }, 180000); }
async function devWeb({sys, parts, json, out, temperature, signal, onStatus, auto}){
  const L = devLabel(), m = DEVAI.web;
  if (DEVAI.status !== "available" && !webEng) {
    if (auto) throw aiErr("auto-off", `${L} isn't downloaded yet.`);
    const a = await webAsk(m);
    if (a === "key") { try { aiSetupSheet(true); } catch (e) {} throw aiErr("nokey", "Add an AI key in AI Features, or download the free AI to this computer."); }
    if (a !== "yes") { devLs.set(WEB_DECLINED, "1"); DEVAI.status = "declined"; try { scheduleRender(); } catch (e) {} throw aiErr("no-consent", "The free AI wasn't downloaded. You can download it any time in Settings, AI Features."); }
    devLs.set(WEB_DECLINED, "");
  }
  let eng;
  try { eng = await webEngine(onStatus); }
  catch (e) { throw Object.assign(aiErr("device-failed", /network|fetch|Failed to fetch|NetworkError/i.test(webErrText(e)) ? `${L} couldn't finish downloading. Check your connection, then try again.` : `This computer couldn't start ${L}. A free AI key in Settings, AI Features works instead.`), {detail: webErrText(e).slice(0, 300)}); }
  const stop = () => { try { eng.interruptGenerate(); } catch (e) {} };
  if (signal) signal.addEventListener("abort", stop, {once: true});
  try {
    // the format goes in the instructions too: WebLLM's docs warn a model not told it can run on without stopping
    const sysF = sys + "\n\nReply with JSON that matches this JSON Schema exactly: " + JSON.stringify(json);
    const o2 = Math.min(out, 1200), room = () => Math.max(500, (DEVAI.ctx || 4096) - devTokens(sysF) - o2 - 120);
    let truncated = devFit(parts, room());
    for (let tries = 0; ; tries++) {
      const user = parts.filter(p => p.text != null).map(p => p.text).join("\n\n");
      let r;
      try { r = await eng.chat.completions.create({messages: [{role: "system", content: sysF}, {role: "user", content: user}], temperature: temperature == null ? 0.3 : Math.min(0.7, temperature), max_tokens: o2, response_format: {type: "json_object", schema: JSON.stringify(json)}}); }
      catch (e) {
        if (signal && signal.aborted) throw aiErr("aborted", "Stopped.");
        if (/context|too long|exceed.*(window|length)|prompt.*long/i.test(webErrText(e)) && tries < 2) { truncated = devFit(parts, Math.floor(room() * (0.66 - tries * 0.2))) || truncated; continue; }
        throw Object.assign(aiErr("device-failed", `${L} couldn't answer that. Try again.`), {detail: webErrText(e).slice(0, 300)});
      }
      const ch = (r && r.choices && r.choices[0]) || {}, data = aiParseJson(ch.message && ch.message.content);
      if (data == null || typeof data !== "object") throw aiErr("bad", `${L} sent back something Studyboard couldn't read. Try again.`);
      return {data, model: m.id, provider: "device", truncated: truncated || ch.finish_reason === "length"};
    }
  } finally { if (signal) signal.removeEventListener("abort", stop); webRest(); }
}
/* ---------- The stronger on-device AI: Gemma 4 E4B, for computers with 16 GB of memory or more ----------
   Google's Gemma 4 E4B (Apache 2.0, 3.3 GB), run by LiteRT-LM (vendor/litertlm-0.19.0) on the graphics chip. Clearly better than
   E2B or Chrome's built-in AI at following instructions and at reasoning (MMLU-Pro 69% against E2B's 60%), so on a computer that
   can hold it, it's the AI everything uses once it's downloaded. Until then the student keeps using what they have (Chrome's AI, or
   E2B), and nothing waits on the download.
   The download, after one "yes":
   - Desktop app: done by the app itself (main.js), into its own folder: it keeps going with the window closed, resumes after sleep
     or a lost connection, and the browser can never clear it.
   - Chrome and Edge: Background Fetch (sw.js), so the browser downloads it even after the tab is closed, with its own progress.
   - Other browsers: in 64 MB parts while Studyboard is open, picking up where it stopped.
   Only on Wi-Fi (or a connection that isn't metered) with Data Saver off, only with room to spare, and the storage is marked
   persistent so the browser doesn't clear it to free space. */
const E4B = {url: "https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/resolve/main/gemma-4-E4B-it-gpu.litertlm", size: 3310938740, gb: 3.3, name: "Gemma 4",
  sha256: "ea168f5a601b543e02712f9381f26b06ddc7d4cbe2406410387c82d69b995a60", ctx: 8192, part: 64 * 1024 * 1024, cache: "studyboard-ai-e4b", bg: "studyboard-ai-e4b",
  wasmCdn: "https://cdn.jsdelivr.net/npm/@litert-lm/core@0.19.0/wasm", dir: "vendor/litertlm-0.19.0/",
  // Studyboard's own copy (cloudflare/ai-model): the same file in 16 MiB pieces as free static files on Cloudflare, so a busy school
  // network isn't held up by Hugging Face's limits; Hugging Face stays the fallback
  mirror: "https://studyboard-ai-model.connor-pelkmans.workers.dev/e4b/ea168f5a/", chunk: 16 * 1024 * 1024};
const E4B_ON = "studyboard:e4bOn", E4B_READY = "studyboard:e4bReady", E4B_FAIL = "studyboard:e4bFail";
const e4bDesk = () => { try { return window.studiosoDesktop && window.studiosoDesktop.aiModel ? window.studiosoDesktop.aiModel : null; } catch (e) { return null; } };
const e4bParts = () => Math.ceil(E4B.size / E4B.part);
// each part's key in the cache (a query, not a #fragment: the cache ignores fragments)
const e4bKey = i => `${E4B.url}?studyboard-part=${i}`;
// Memory: the desktop app knows exactly; Chrome and Edge 147+ say 16 or 32 on desktops (older ones stop at 8); others don't say
async function e4bMemGB(){
  const D = e4bDesk(); if (D) { try { const i = await D.info(); if (i && i.ram) return i.ram / 1073741824; } catch (e) {} }
  return Number(navigator.deviceMemory) || 0;
}
// Can this computer run it? A desktop or laptop with 16 GB (15 GB or more counts: 16 GB machines report a little under), a graphics
// chip with WebGPU and 16-bit shaders, and room in its buffers for the model's layers
async function e4bFits(){
  if (window.__SB_TEST && window.__SB_E4B_STUB) return !!window.__SB_E4B_STUB.fits;
  try {
    if (!devAllowed() || devNative() || devPhone() || devTablet()) return false;
    if ((await e4bMemGB()) < 15) return false;
    const gpu = webGpu(); if (!gpu) return false;
    const ad = await gpu.requestAdapter(); if (!ad) return false;
    return !!(ad.features && ad.features.has && ad.features.has("shader-f16")) && (ad.limits.maxBufferSize || 0) >= 268435456 && (ad.limits.maxStorageBufferBindingSize || 0) >= 134217728;
  } catch (e) { return false; }
}
// How much is downloaded (0 to 1), and whether all of it is
async function e4bHave(){
  const D = e4bDesk();
  if (D) { try { const i = await D.info(); return i && i.size ? Math.min(1, (i.have || 0) / i.size) : 0; } catch (e) { return 0; } }
  try { const c = await caches.open(E4B.cache), keys = await c.keys(); return Math.min(1, keys.filter(r => r.url.startsWith(E4B.url + "?studyboard-part=")).length / e4bParts()); } catch (e) { return 0; }
}
const e4bNetOk = () => { const c = navigator.connection; if (!c) return true; return !c.saveData && c.type !== "cellular" && !/(^|-)2g$/.test(c.effectiveType || "") ; };
let e4bRunning = null;
// The download: started once the student agrees, picked up again whenever Studyboard opens until it's done
function e4bDownload(){
  // (Pause then Download again before the last parts stopped: once that run ends, a new one starts)
  if (e4bRunning) return e4bRunning.then(() => { if (devLs.get(E4B_ON) === "1" && DEVAI.e4b !== "ready" && !e4bRunning) return e4bDownload(); });
  DEVAI.e4bFull = false; DEVAI.e4bErr = "";
  e4bRunning = (async () => {
    const D = e4bDesk(); let top = 0; const say = p => { top = Math.max(top, p); DEVAI.e4bPct = top;  // (never backwards: a part that's retried keeps the progress shown)
 DEVAI.e4b = p >= 1 ? "ready" : "downloading"; e4bPaint(); try { scheduleRender(); } catch (e) {} };
    try {
      if (D) {
        // the app downloads it itself; this only follows along
        D.onProgress && D.onProgress(i => { if (i && i.size) say(Math.min(1, i.have / i.size)); if (i && i.done) e4bReadyNow(true); });
        await D.start({url: E4B.url, size: E4B.size, sha256: E4B.sha256});
        return;
      }
      if (!e4bNetOk()) { DEVAI.e4b = "waiting"; return; }
      try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
      try { const est = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null; if (est && est.quota && est.quota - est.usage < E4B.size * (1 - await e4bHave()) + 1073741824) { DEVAI.e4b = "full"; try { scheduleRender(); } catch (e) {} return; } } catch (e) {}
      const cache = await caches.open(E4B.cache), have = new Set((await cache.keys()).map(r => r.url)), missing = [];
      for (let i = 0; i < e4bParts(); i++) if (!have.has(e4bKey(i))) missing.push(i);
      const range = i => `bytes=${i * E4B.part}-${Math.min(E4B.size, (i + 1) * E4B.part) - 1}`;
      say(1 - missing.length / e4bParts());
      // Chrome and Edge: the browser downloads the missing parts itself (it carries on after the tab closes); this page follows along
      try {
        const reg = navigator.serviceWorker && await Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(r, 3000))]);
        // (not Background Fetch any more: Chrome shows it as a download in its toolbar, and finished downloads didn't always reach the
        //  page's storage. An earlier one still running is stopped; the page downloads quietly instead, below)
        try { const old = reg && reg.backgroundFetch ? await reg.backgroundFetch.get(E4B.bg) : null; if (old) await old.abort(); } catch (e) {}
        if (false && missing.length && reg && reg.backgroundFetch && !(window.__SB_TEST && window.__SB_E4B_STUB && window.__SB_E4B_STUB.noBg)) {
          let bf = await reg.backgroundFetch.get(E4B.bg);
          if (!bf) bf = await reg.backgroundFetch.fetch(E4B.bg, missing.map(i => new Request(E4B.url, {headers: {Range: range(i)}})), {title: "Studyboard's free AI (one time, about 3.3 GB)", downloadTotal: missing.reduce((n, i) => n + Math.min(E4B.size, (i + 1) * E4B.part) - i * E4B.part, 0)});
          await new Promise(done => { const tick = () => { if (bf.downloadTotal) say(1 - missing.length / e4bParts() + (bf.downloaded / E4B.size)); }; bf.addEventListener("progress", () => { tick(); if (bf.result) done(); }); tick(); if (bf.result) done(); });
          // the service worker stores the parts as they finish; anything still missing is fetched below
          await new Promise(r => setTimeout(r, 1500));
          const now = new Set((await cache.keys()).map(r => r.url)); missing.splice(0, missing.length, ...missing.filter(i => !now.has(e4bKey(i))));
        }
      } catch (e) {}
      // elsewhere (and anything Background Fetch didn't finish): part by part, while Studyboard is open
      // (4 parts at a time: one connection to the download server is often slower than the student's internet)
      const queue = missing.slice(); let stop = false; const inFlight = {};
      let liveAt = 0; const sayLive = () => Date.now() - liveAt < 700 ? 0 : (liveAt = Date.now(), say(Math.min(0.999, (e4bParts() - missing.length) / e4bParts() + Object.values(inFlight).reduce((n, x) => n + x, 0) / E4B.size)));
      const one = async i => {
        if (!e4bNetOk() || devLs.get(E4B_ON) !== "1") { stop = true; return; }
        let ok = false;
        for (let t = 0; t < (E4B.mirror ? 4 : 3) && !ok; t++) {
          try {
            // read as it arrives: the percentage moves within a part, and a part that stalls for a minute is tried again
            // from Studyboard's own copy first (its 16 MiB files, four to a part), else from Hugging Face; after a failed try, the other one
            const want = Math.min(E4B.size, (i + 1) * E4B.part) - i * E4B.part, chunks = []; let got = 0;
            const fromMirror = E4B.mirror && (t % 2 === 0);
            const urls = fromMirror ? Array.from({length: Math.ceil(want / E4B.chunk)}, (_, k) => `${E4B.mirror}c${String(i * (E4B.part / E4B.chunk) + k).padStart(4, "0")}.bin`) : [E4B.url];
            try {
              for (const u of urls) {
                const ac = new AbortController(); let stall = setTimeout(() => ac.abort(), 60000);
                try {
                  const r = await fetch(u, fromMirror ? {signal: ac.signal} : {headers: {Range: range(i)}, signal: ac.signal}); if (!(r.status === 206 || r.status === 200)) throw new Error("HTTP " + r.status);
                  const rd = r.body.getReader();
                  for (;;) { const {done, value} = await rd.read(); if (done) break; chunks.push(value); got += value.length; inFlight[i] = got;
                    clearTimeout(stall); stall = setTimeout(() => ac.abort(), 60000); sayLive(); }
                } finally { clearTimeout(stall); }
              }
            } finally { delete inFlight[i]; }
            const b = new Blob(chunks); if (b.size !== want) throw new Error("short part");
            await cache.put(new Request(e4bKey(i)), new Response(b, {headers: {"Content-Length": String(b.size)}})); ok = true;
          } catch (e) {
            // (why, for the row in AI Features: no room left in the browser's storage is the usual reason it stops near the end)
            DEVAI.e4bErr = String((e && (e.name === "QuotaExceededError" ? "quota" : e.name === "AbortError" ? "stalled" : e.message)) || e).slice(0, 80);
            if (DEVAI.e4bErr === "quota") { stop = true; DEVAI.e4bFull = true; return; }
            // (a refused request is usually the download server saying "too many, slow down": wait properly before asking again)
            await new Promise(r => setTimeout(r, E4B.mirror ? [1000, 15000, 60000, 180000][t] : [15000, 60000, 180000][t] || 180000));
          }
        }
        if (!ok) { stop = true; return; }
        missing.splice(missing.indexOf(i), 1); say(1 - missing.length / e4bParts());
      };
      await Promise.all([0, 1, 2, 3].map(async () => { while (queue.length && !stop) await one(queue.shift()); }));
      if (stop && missing.length) { DEVAI.e4b = DEVAI.e4bFull ? "full" : "waiting"; e4bPaint(); return; }
      if (!missing.length) await e4bReadyNow(true);
    } catch (e) { DEVAI.e4b = "waiting"; }
    finally { e4bRunning = null; }
  })();
  return e4bRunning;
}
// Ready: everything's downloaded. From then on it's the AI this computer uses
async function e4bReadyNow(fresh){
  const stub = window.__SB_TEST && window.__SB_E4B_STUB;
  if (stub && "ready" in stub) { if (!stub.ready) return false; }
  else if ((await e4bHave()) < 1) return false;
  devLs.set(E4B_READY, "1"); DEVAI.e4b = "ready"; DEVAI.e4bPct = 1;
  DEVAI.kind = "litert"; DEVAI.status = "available"; DEVAI.ctx = E4B.ctx; DEVAI.images = false; DEVAI.why = "";
  if (fresh) { try { toast("Studyboard's stronger free AI is ready on this computer. It's used from now on."); scheduleRender(); } catch (e) {} }
  return true;
}
// Asked once (and offered again in AI Features): a quiet note with a button, never a blocking question
async function e4bOffer(){
  const on = devLs.get(E4B_ON);
  if (on === "1") { if (DEVAI.e4b !== "ready") e4bDownload(); return; }
  // (asked on the Get Your Free AI Ready page, before setup, a first AI set, or an AI button; and offered in AI Features)
  return;
}
function e4bAgree(yes){ devLs.set(E4B_ON, yes ? "1" : "0"); if (yes) { DEVAI.e4b = "downloading"; e4bDownload(); try { toast("Downloading in the background. Keep using Studyboard; it switches over by itself when it's ready."); } catch (e) {} } else { DEVAI.e4b = "eligible"; } try { scheduleRender(); } catch (e) {} }
// Taking it off this computer (AI Features): the files go and the computer goes back to the AI it had
async function e4bRemove(){
  devLs.set(E4B_ON, "0"); devLs.set(E4B_READY, "");
  const D = e4bDesk(); if (D) { try { await D.remove(); } catch (e) {} } else { try { await caches.delete(E4B.cache); } catch (e) {} }
  e4bStop(); DEVAI.e4b = "eligible"; DEVAI.e4bPct = 0; DEVAI.kind = ""; DEVAI.status = ""; await devProbe();
}
// Decided once a page load, after the usual probe: is it here, can it be, and does the student want it
async function e4bCheck(){
  try {
    if (window.__SB_TEST && window.__SB_E4B_STUB && window.__SB_E4B_STUB.file) Object.assign(E4B, window.__SB_E4B_STUB.file);
    if (!(await e4bFits())) { DEVAI.e4b = ""; return; }
    if (await e4bReadyNow(false)) return;
    DEVAI.e4b = devLs.get(E4B_ON) === "1" ? "downloading" : "eligible"; DEVAI.e4bPct = await e4bHave();
    e4bOffer();
  } catch (e) {}
}
// AI Features: the stronger AI's row (download, progress, waiting for Wi-Fi, ready, remove)
// the row in AI Features, kept up to date while the sheet is open (the download runs while the student watches)
function e4bRow(){ return `<div id="e4bLive">${e4bRowIn()}</div>`; }
setInterval(() => { try { e4bPaint(); } catch (e) {} }, 1000);
// which AI answers, for AI Features' top box (kept current too: E4B can finish downloading while the sheet is open)
function aiDevName(){ const L = devLabel(), M = devModel(); return esc(L) + (M && !L.includes(M.replace(/^\S+ /, "")) ? ` (${esc(M)})` : ""); }
function e4bPaint(){
  const el = document.getElementById("e4bLive"); if (el) { const h = e4bRowIn(); if (el.innerHTML !== h) el.innerHTML = h; }
  const nm = document.getElementById("aiDevName"); if (nm) { const h = aiDevName(); if (nm.innerHTML !== h) nm.innerHTML = h; }
}
function e4bRowIn(){
  const st = DEVAI.e4b, pct = Math.round((DEVAI.e4bPct || 0) * 100); if (!st) return "";
  const box = (t, btn) => `<div class="ai-disclaimer ai-device" style="display:grid;gap:8px"><p style="margin:0">${t}</p>${btn ? `<div style="display:flex;gap:8px;flex-wrap:wrap">${btn}</div>` : ""}</div>`;
  const nm = `Google's ${E4B.name} (E4B)`;
  if (st === "ready") return box(`<b>Stronger free AI is on.</b> ${nm} runs on this computer's graphics chip: private, free, and the AI Studyboard uses here.`, `<button type="button" class="btn small" data-e4b="remove">Remove It</button>`);
  if (st === "eligible") return box(`<b>This computer can run a stronger free AI.</b> ${nm} follows instructions and explains things noticeably better. It downloads once in the background (about ${E4B.gb} GB, Wi-Fi only) while you keep working.`, `<button type="button" class="btn small primary" data-e4b="get">Download in the Background</button>`);
  if (st === "downloading") return box(`<b>Downloading the stronger free AI:</b> ${pct}%. Keep using Studyboard${e4bDesk() ? " (it carries on with the window closed)" : ""}; it switches over by itself when it's done.`, `<button type="button" class="btn small" data-e4b="stop">Pause</button>`);
  if (st === "waiting") return box(`<b>The stronger free AI is ${pct}% downloaded.</b> ${DEVAI.e4bErr ? `The last part didn't come through (${esc(DEVAI.e4bErr === "stalled" ? "the connection stalled" : DEVAI.e4bErr)}). Tap Try Now, or it tries again next time you open Studyboard.` : "It carries on when you're on Wi-Fi with Data Saver off."}`, `<button type="button" class="btn small" data-e4b="get">Try Now</button><button type="button" class="btn small" data-e4b="stop">Stop</button>`);
  if (st === "full") return box(`<b>Not enough free space for the stronger free AI.</b> It needs about ${E4B.gb} GB. Free some space, then try again.`, `<button type="button" class="btn small" data-e4b="get">Try Again</button>`);
  return "";
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-e4b]"); if (!b) return;
  const a = b.dataset.e4b;
  if (a === "get") e4bAgree(true);
  else if (a === "stop") { devLs.set(E4B_ON, "0"); const D = e4bDesk(); if (D && D.pause) D.pause().catch(() => {}); DEVAI.e4b = "eligible"; try { scheduleRender(); toast("Paused. Download it again any time here."); } catch (x) {} }
  else if (a === "remove") e4bRemove().then(() => { try { scheduleRender(); toast("Removed. Studyboard uses the AI it had before."); } catch (x) {} });
});
/* Talking to the model: one worker, loaded on first use and let go after a few idle minutes (its graphics memory is freed) */
let e4bW = null, e4bLoad = null, e4bIdle = null, e4bSeq = 0;
const e4bWait = new Map();
// Loading E4B onto the graphics chip takes a while the first time after the page opens (it reads 3.3 GB): it starts as soon as
// the student goes to type to the AI, so the first answer doesn't wait on it, and the chat gives that first load extra time
let e4bLoaded = false, e4bOff = false;
// (vendor/ files are cached for a month: a new worker gets a new address)
// The answer's shape enforced by LiteRT-LM itself (a "respond" tool with constrained decoding): on once SBAITEST() has seen it work
// quickly on this computer's graphics chip; otherwise Studyboard asks for plain JSON and checks the shape itself
const E4B_TOOL = "studyboard:e4bTool";
// In the browser's console: await SBAITEST(). Times both ways on this computer, says which works, and keeps the better one.
window.SBAITEST = async () => {
  if (DEVAI.kind !== "litert") return "Gemma 4 E4B isn't the AI in use here (it's " + (devLabel() || "none") + ").";
  const out = {}, t0 = Date.now(); await e4bWorker(s => console.log(s)); out.loadSeconds = Math.round((Date.now() - t0) / 100) / 10;
  const schema = {type: "object", properties: {intent: {type: "string", enum: ["question", "add_task", "add_card", "cant"]}, title: {type: "string"}}, required: ["intent"]};
  const one = tool => new Promise(res => { const id = ++e4bSeq, t = Date.now(); let first = 0;
    const done = (ok, text) => { e4bWait.delete(id); res({ok, seconds: Math.round((Date.now() - t) / 100) / 10, firstWordSeconds: first ? Math.round((first - t) / 100) / 10 : null, text: String(text || "").slice(0, 200)}); };
    e4bWait.set(id, {ok: x => done(true, x), no: e => done(false, e && e.message), part(){ if (!first) first = Date.now(); }});
    setTimeout(() => { if (e4bWait.has(id)) { try { e4bW.postMessage({t: "cancel", id}); } catch (e) {} done(false, "no answer in 120 s"); } }, 120000);
    e4bW.postMessage({t: "ask", id, system: "Pick the intent of the student's message for their study planner.", text: "add essay draft due friday", schema, maxTokens: 60, temperature: 0, tool}); });
  out.plain = await one(false); out.tool = await one(true);
  const valid = x => { try { const d = aiParseJson(x.text); return !!d && ["question", "add_task", "add_card", "cant"].includes(d.intent); } catch (e) { return false; } };
  out.plainValid = out.plain.ok && valid(out.plain); out.toolValid = out.tool.ok && valid(out.tool);
  const useTool = out.toolValid && (!out.plainValid || out.tool.seconds <= out.plain.seconds * 1.5);
  devLs.set(E4B_TOOL, useTool ? "1" : "0"); out.using = useTool ? "constrained (tool)" : "plain JSON, checked by Studyboard";
  console.table({plain: out.plain, tool: out.tool}); return out;
};
const E4B_WORKER_V = "5";
function e4bWarm(){ if (DEVAI.kind === "litert" && DEVAI.e4b === "ready" && !e4bLoad) e4bWorker().then(() => { e4bRest(); }, () => {}); }
document.addEventListener("focusin", e => { try { if (e.target && e.target.matches && e.target.matches("#cptIn, .cp-ask-in, [data-ai-input]")) e4bWarm(); } catch (x) {} });
// reaching for anything AI (an AI button, AI Features): it starts loading too
["pointerover", "pointerdown"].forEach(ev => document.addEventListener(ev, e => { try { if (DEVAI.kind === "litert" && !e4bLoad && e.target && e.target.closest && e.target.closest('[data-act^="ai"], [data-act^="cpt"], [data-ai], .ai-btn, .ai-chip, #cptIn, .cp-ask-in')) e4bWarm(); } catch (x) {} }, {passive: true}));
// someone who used it this past week: loaded quietly a few seconds after Studyboard opens, so it's ready before they ask
const E4B_USED = "studyboard:e4bUsedAt";
setTimeout(() => { try { if (Date.now() - Number(devLs.get(E4B_USED) || 0) < 7 * 864e5 && document.visibilityState === "visible") e4bWarm(); } catch (x) {} }, 8000);
function e4bStop(){ clearTimeout(e4bIdle); try { e4bW && e4bW.terminate(); } catch (e) {} e4bW = null; e4bLoad = null; e4bLoaded = false; e4bWait.forEach(w => w.no(aiErr("device-failed", "Stopped."))); e4bWait.clear(); }
async function e4bModel(){
  if (window.__SB_TEST && window.__SB_E4B_STUB && window.__SB_E4B_STUB.model) return window.__SB_E4B_STUB.model;
  const D = e4bDesk(); if (D) return new URL("__ai-model/e4b.litertlm", location.href).href;
  const c = await caches.open(E4B.cache), blobs = [];
  for (let i = 0; i < e4bParts(); i++) { const r = await c.match(e4bKey(i)); if (!r) throw Object.assign(aiErr("device-failed", "Part of the AI is missing. It's downloading again."), {missing: true}); blobs.push(await r.blob()); }
  return new Blob(blobs);
}
function e4bWorker(onStatus){
  clearTimeout(e4bIdle);
  if (e4bLoad) return e4bLoad;
  e4bLoad = (async () => {
    const stub = window.__SB_TEST && window.__SB_E4B_STUB;
    e4bW = stub && stub.worker ? stub.worker() : new Worker(new URL(E4B.dir + "worker.js?v=" + E4B_WORKER_V, location.href).href);
    e4bW.onmessage = e => { const m = e.data || {}, w = e4bWait.get(m.id); if (!w) return; if (m.t === "partial") w.part(m.n, m.text); else { e4bWait.delete(m.id); if (m.t === "done" || m.t === "loaded") w.ok(m.text); else w.no(Object.assign(aiErr("device-failed", "Studyboard's on-device AI couldn't answer that. Try again."), {detail: String(m.message || "").slice(0, 300)})); } };
    if (onStatus) onStatus("Starting Studyboard's on-device AI… The first time after opening Studyboard takes up to a minute.");
    const model = await e4bModel(), local = e4bDesk() ? [new URL(E4B.dir + "wasm", location.href).href] : [];
    await new Promise((ok, no) => { e4bWait.set(0, {ok, no, part(){}}); e4bW.postMessage({t: "load", id: 0, model, wasm: local.concat(E4B.wasmCdn), ctx: E4B.ctx}); });
    e4bLoaded = true;
  })().catch(e => { e4bStop(); throw e; });
  // "loaded" answers with id 0 too
  return e4bLoad;
}
function e4bRest(){ clearTimeout(e4bIdle); e4bIdle = setTimeout(() => { if (!e4bWait.size) e4bStop(); }, 20 * 60000); }
// the "answer" (or "text") field of a JSON reply that's still being written
function devLiveAnswer(t){
  const m = /"(?:answer|text|reply)"\s*:\s*"((?:[^"\\]|\\.)*)/.exec(String(t || "")); if (!m) return "";
  let v = m[1].replace(/\\$/, ""); try { v = JSON.parse('"' + v + '"'); } catch (e) { v = v.replace(/\\n/g, "\n").replace(/\\"/g, '"'); }
  return v.trim().length > 12 ? v : "";
}
async function devLite({sys, parts, json, out, temperature, signal, onStatus, onPartial}){
  const L = devLabel();
  try { await e4bWorker(onStatus); }
  catch (e) {
    // part of the download went missing (the browser cleared some of it): it's fetched again, and the AI it had is used meanwhile
    if (e && e.missing) { devLs.set(E4B_READY, ""); DEVAI.e4b = "downloading"; DEVAI.kind = ""; DEVAI.status = ""; await devProbe(); e4bDownload(); throw e; }
    // it won't start on this computer after all (its graphics chip can't hold it): back to the AI it had, for good
    devLs.set(E4B_FAIL, "1"); devLs.set(E4B_READY, ""); DEVAI.e4b = ""; DEVAI.kind = ""; DEVAI.status = ""; await devProbe();
    throw Object.assign(aiErr("device-failed", `${L} couldn't start on this computer. Studyboard switched back to the AI it had; try again.`), {detail: String((e && e.message) || e).slice(0, 300)});
  }
  // E4B can reason a little before it answers: asked to, it checks itself against what it was given
  sys = String(sys) + "\n\nBefore you answer: read the request and everything given with it carefully, work out exactly what is being asked, and check every fact you use against what you were given (for the student's own work, dates, marks and files, use only that). Then answer exactly what was asked, completely and accurately.";
  const o2 = Math.min(out, 2000), room = () => Math.max(800, E4B.ctx - devTokens(sys) - o2 - devTokens(JSON.stringify(json)) - 300);
  const truncated = devFit(parts, room());
  const text = parts.filter(p => p.text != null).map(p => p.text).join("\n\n"), id = ++e4bSeq, t0 = Date.now();
  let last = Date.now(), dog = null, any = false;
  try {
    const raw = await new Promise((ok, no) => {
      e4bWait.set(id, {ok, no, part(n, txt){ last = Date.now(); any = true;
        // the answer as it's written: the "answer" field of the JSON so far, shown live
        const live = onPartial && txt ? devLiveAnswer(txt) : "";
        if (live) onPartial(live); else if (onStatus) onStatus(`${L} is writing… ${Math.max(1, Math.round(n / 6))} words so far (${Math.round((Date.now() - t0) / 1000)}s)`); }});
      const stop = () => { try { e4bW.postMessage({t: "cancel", id}); } catch (e) {} e4bWait.delete(id); no(aiErr("aborted", "Stopped.")); };
      if (signal) signal.addEventListener("abort", stop, {once: true});
      // nothing new for 30 seconds once it's writing (90 before the first words: a slower graphics chip reads a long request first),
      // or 4 minutes in all: stopped, not waited on forever
      dog = setInterval(() => { if (Date.now() - last > (any ? 30000 : 90000) || Date.now() - t0 > DEV_MAX_MS + 60000) { try { e4bW.postMessage({t: "cancel", id}); } catch (e) {} e4bWait.delete(id); no(Object.assign(aiErr("device-stall", `${L} stopped answering.`), {wrote: any})); } }, 1000);
      e4bW.postMessage({t: "ask", id, system: sys, text, schema: json, maxTokens: o2, temperature, tool: devLs.get(E4B_TOOL) === "1"});
    });
    const data = aiParseJson(raw);
    if (data == null || typeof data !== "object") throw aiErr("bad", `${L} sent back something Studyboard couldn't read. Try again.`);
    try { devLs.set(E4B_USED, String(Date.now())); } catch (x) {}
    return {data, model: "gemma-4-e4b", provider: "device", truncated};
  } finally { clearInterval(dog); e4bRest(); }
}
/* ---------- Getting the free AI ready first ----------
   One friendly page, before Set Up Your Semester and before the first Create with AI: the AI that runs on this computer starts
   downloading from that tap, in the background, while the student finishes setting up, so it's ready by the time they need it.
   Whichever this computer gets: Gemma 4 E4B (16 GB or more), else Chrome's (or Edge's) built-in AI, else Gemma 4 E2B. Asked once;
   not shown when the AI is ready already, with a key or Studyboard AI Pro, or where none can run. */
const AI_READY_ASKED = "studyboard:aiReadyAsked";
function aiReadyWhich(){
  try {
    if (!devAllowed() || (devLs.get(AI_READY_ASKED) && !aiReadyWhich.again) || (window.__SB_TEST && !window.__SB_AI_READY_TEST)) return null;
    // (not with a key or Studyboard AI Pro: those don't need anything downloaded)
    const c = aiCfg(); if (c.provider !== "device" && c.key) return null;
  } catch (e) { return null; }
  if (DEVAI.e4b === "eligible" && devLs.get(E4B_ON) !== "0") return {kind: "e4b", gb: E4B.gb};
  if (DEVAI.status === "available" || DEVAI.e4b === "ready" || DEVAI.e4b === "downloading") return null;
  if (DEVAI.kind === "chrome" && ["downloadable", "downloading"].includes(DEVAI.status)) return {kind: "chrome"};
  if (DEVAI.kind === "webllm" && ["downloadable", "declined"].includes(DEVAI.status) && DEVAI.web) return {kind: "webllm", gb: DEVAI.web.gb};
  return null;
}
// A pill at the bottom with the progress, like Chrome's own
function aiReadyPill(p, label){
  let el = document.getElementById("aiReadyPill");
  if (p == null || p >= 1) { if (el) { el.classList.remove("show"); setTimeout(() => { if (el && !el.classList.contains("show")) el.remove(); }, 400); } return; }
  if (!el) { el = document.createElement("div"); el.id = "aiReadyPill"; el.className = "toast sync-pill"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite"); }
  const h = toastHost(); if (el.parentNode !== h) h.appendChild(el);
  el.textContent = `${label} is getting ready in the background${p > 0 ? `: ${Math.round(p * 100)}%` : "…"} Keep going, nothing waits on it.`;
  requestAnimationFrame(() => el.classList.add("show"));
}
function aiReadyStart(w){
  if (w.kind === "e4b") { e4bAgree(true); return; }
  if (w.kind === "chrome") { devWarm(); return; }
  if (w.kind === "webllm") {
    devLs.set(WEB_DECLINED, ""); DEVAI.status = "downloadable";
    // loading it once downloads it; the first AI request then finds it ready (and doesn't ask again)
    webEngine(m => { const x = /(\d+)%/.exec(String(m || "")); aiReadyPill(x ? Number(x[1]) / 100 : 0, "Studyboard's free AI"); })
      .then(() => { aiReadyPill(null); webRest(); try { toast("Studyboard's free AI is ready on this computer."); scheduleRender(); } catch (e) {} }, () => aiReadyPill(null));
  }
}
// Shows the page and returns true (then() runs after the student picks); false when there's nothing to get ready
function aiReadyFirst(then){
  const w = aiReadyWhich(); if (!w) return false;
  // (closed with ✕ counts as Not Now)
  devLs.set(AI_READY_ASKED, "no"); window.__SB_E4B_ASKED = true;
  const size = w.gb ? `about ${w.gb} GB` : "a one-time download", where = w.kind === "chrome" ? `${devBrowser()} downloads it` : "Studyboard downloads it";
  openSheet(`<form class="sheet ai-ready-sheet">${typeof bandHead === "function" ? bandHead("Get Your Free AI Ready", AI_ICON, "var(--accent-band,var(--accent))", "") : `<div class="sheet-head"><h2>Get Your Free AI Ready</h2></div>`}
    <div class="sheet-body">
      <p style="margin:0">Studyboard comes with a free AI helper that runs right on this computer: private, nothing to sign up for, and nothing you add leaves your computer.</p>
      <ul class="ai-ready-list">
        <li>Makes flashcards and practice quizzes from your notes and slides</li>
        <li>Answers questions about your classes, notes and deadlines</li>
        <li>Adds and changes tasks, timers and notes when you ask</li>
      </ul>
      <p class="mini" style="margin:0">${where} once, in the background (${size}, best on Wi-Fi), while you keep setting things up. You can change this any time in Settings, AI Features.</p>
    </div>
    <div class="sheet-foot"><button type="button" class="btn" data-ready="no">Not Now</button><span class="spacer"></span><button type="button" class="btn primary" data-ready="yes">Get It Ready</button></div>
  </form>`);
  const go = yes => { devLs.set(AI_READY_ASKED, yes ? "1" : "no"); if (yes) aiReadyStart(w); else if (w.kind === "e4b") devLs.set(E4B_ON, ""); try { dlg.close(); } catch (e) {} setTimeout(() => { try { then && then(); } catch (e) { console.warn(e); } }, 60); };
  // (the download starts inside the tap itself: Chrome only starts its model's download from a tap)
  dlg.querySelector('[data-ready="yes"]').addEventListener("click", () => go(true));
  dlg.querySelector('[data-ready="no"]').addEventListener("click", () => go(false));
  return true;
}
// Said Not Now on that page: offered once more, as one line, on the setup's last step ("Here is your week"), when the student has
// just seen their semester come together. Never again after that.
function aiReadyLine(){
  // (kept while this step is open: the step redraws as the student changes things)
  if (!(devLs.get(AI_READY_ASKED) === "no" || (devLs.get(AI_READY_ASKED) === "again" && window.__sbReadyLine))) return "";
  aiReadyWhich.again = true; let w; try { w = aiReadyWhich(); } finally { aiReadyWhich.again = false; }
  if (!w) return "";
  devLs.set(AI_READY_ASKED, "again"); window.__sbReadyLine = true;
  return `<p class="sem-lead ai-ready-line">${AI_ICON}<span>Want the free AI helper ready for studying this week? It gets set up in the background${w.gb ? ` (about ${w.gb} GB, best on Wi-Fi)` : ""}.</span><button type="button" class="btn small primary" data-ready-line>Get It Ready</button></p>`;
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-ready-line]"); if (!b) return;
  aiReadyWhich.again = true; let w; try { devLs.set(AI_READY_ASKED, ""); w = aiReadyWhich(); } finally { aiReadyWhich.again = false; devLs.set(AI_READY_ASKED, "1"); }
  if (w) aiReadyStart(w);
  window.__sbReadyLine = false;
  const line = b.closest(".ai-ready-line"); if (line) line.innerHTML = `${AI_ICON}<span>Getting it ready in the background. It's there when you need it.</span>`;
});
/* Someone using Studyboard with no AI working yet (no key, no Studyboard AI Pro, nothing on the computer): the first AI button they tap
   shows Get Your Free AI Ready, and then does what it was tapped for. Once only, like the page itself. Someone whose AI already
   works isn't interrupted (a stronger one is offered in AI Features). */
const aiWorksNow = () => { try { if (DEVAI.status === "available") return true; if (typeof aiProAvail === "function" && aiProAvail()) return true; const c = aiCfg(); return !!(c.key && c.provider !== "device"); } catch (e) { return true; } };
document.addEventListener("click", e => {
  if (!e.isTrusted) return;
  const el = e.target && e.target.closest && e.target.closest("[data-act]"); if (!el) return;
  const act = el.dataset.act || ""; if (!DEV_AI_ACT.test(act) || /^ai-setup$|^ai-(quiz|answer|next|submit|up|down|override|pick)/.test(act)) return;
  if (aiWorksNow() || !aiReadyWhich()) return;
  e.preventDefault(); e.stopImmediatePropagation();
  // (clicked again afterwards by the app itself, so this doesn't catch it twice)
  aiReadyFirst(() => { try { el.isConnected && el.click(); } catch (x) {} });
}, true);
/* One Chrome session per set of instructions, kept for three minutes and copied (clone) for each request: the long
   instructions and examples are read once, not again for every part of the notes (on a laptop running the model on its processor
   that reading takes several seconds a request). Each copy is thrown away after its answer, so requests never see each other. */
const devBase = new Map();
async function devSession(sys, pics, signal){
  const key = (pics ? "p:" : "t:") + sys, make = () => self.LanguageModel.create(Object.assign(devOpts(pics), {initialPrompts: [{role: "system", content: sys}]}));
  let b = devBase.get(key);
  if (!b) {
    b = {p: make()}; devBase.set(key, b); b.p.catch(() => devBase.delete(key));
    while (devBase.size > 3) { const [k, v] = devBase.entries().next().value; devBase.delete(k); clearTimeout(v.t); v.p.then(x => x.destroy()).catch(() => {}); }
  }
  clearTimeout(b.t); b.t = setTimeout(() => { if (devBase.get(key) === b) devBase.delete(key); b.p.then(x => x.destroy()).catch(() => {}); }, 180000);
  const base = await b.p;
  if (typeof base.clone === "function") { try { return await base.clone({signal}); } catch (e) { if (signal && signal.aborted) throw e; } }
  return self.LanguageModel.create(Object.assign(devOpts(pics), {initialPrompts: [{role: "system", content: sys}], signal}));
}
// The answer as it's written, so the student sees it moving ("Writing… 120 words so far") instead of a frozen status. Chrome has
// sent each piece on its own (newer) or the whole answer so far (older): both are handled
// A stall (nothing new for DEV_STALL_MS, or the whole answer past DEV_MAX_MS) stops the request instead of waiting forever
// (the first words get longer: a laptop running the model on its processor can read a big part of the notes for half a minute first)
const DEV_STALL_MS = () => (window.__SB_TEST && window.__SB_STALL_MS) || 20000, DEV_FIRST_MS = () => (window.__SB_TEST && window.__SB_STALL_MS) || 60000, DEV_MAX_MS = 180000;
// onPartial: the "answer" field as far as it's written, so a chat shows the reply as it comes
const devPartial = t => { const m = /"answer"\s*:\s*"((?:[^"\\]|\\.)*)/.exec(t); if (!m) return ""; try { return JSON.parse('"' + m[1].replace(/\\$/, "") + '"'); } catch (e) { return m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"'); } };
// A small model can get stuck mid-answer: writing only spaces and line breaks, or the same few characters over and over. That counts
// as a stall too (progress is new non-space text that isn't a loop), and whatever complete items it wrote before are kept.
const devLooping = t => { const x = t.replace(/\s+/g, "").slice(-480); if (x.length < 240) return false;
  for (let p = 1; p <= 80; p++) { const reps = Math.floor(x.length / p); if (reps < 6) break; const u = x.slice(-p); let k = 1; while (k < reps && x.slice(-(k + 1) * p, -k * p) === u) k++; if (k >= 6 && k * p >= 240) return true; }
  return false; };
const devSalvage = t => { const d = aiRepairJson(t); return d && typeof d === "object" && Object.values(d).some(v => Array.isArray(v) && v.length) ? t : null; };
async function devStream(s, content, json, signal, onStatus, onPartial){
  let text = "", last = 0, lastChunk = Date.now(), any = false, ink = 0; const t0 = Date.now(), ac = new AbortController();
  const stop = () => ac.abort(); if (signal) signal.addEventListener("abort", stop, {once: true});
  // the watchdog wins the race even if the stream ignores being stopped
  let stalled; const stall = new Promise(r => { stalled = r; });
  const dog = setInterval(() => { if (Date.now() - lastChunk > (any ? DEV_STALL_MS() : DEV_FIRST_MS()) || Date.now() - t0 > DEV_MAX_MS) { ac.abort(); stalled({stall: true}); } }, 500);
  try {
    const stream = s.promptStreaming([{role: "user", content}], {responseConstraint: json, signal: ac.signal}), it = stream[Symbol.asyncIterator]();
    for (;;) {
      const step = await Promise.race([it.next(), stall]);
      if (step.stall) { try { it.return && it.return(); } catch (e) {} const got = devSalvage(text); if (got) return got; throw aiErr("device-stall", `${devLabel()} stopped answering.`); }
      if (step.done) break;
      const chunk = step.value;
      const c = String(chunk == null ? "" : chunk);
      text = c.startsWith(text) && text ? c : text + c;
      // only new words count as progress; a loop ends the answer at once, keeping the complete items before it
      const n = text.replace(/\s+/g, "").length;
      if (n > ink) { ink = n; if (devLooping(text)) { ac.abort(); try { it.return && it.return(); } catch (e) {} const got = devSalvage(text); if (got) return got; throw aiErr("device-stall", `${devLabel()} stopped answering.`); } lastChunk = Date.now(); any = true; }
      if (Date.now() - last > 150) { last = Date.now();
        if (onPartial) { const a = devPartial(text); if (a) onPartial(a); }
        if (onStatus) { const w = (text.replace(/"[a-zA-Z]+"\s*:/g, " ").match(/[A-Za-z0-9\u00C0-\uFFFF]+/g) || []).length; onStatus(`${devLabel()} is writing… ${w} word${w === 1 ? "" : "s"} so far (${Math.round((Date.now() - t0) / 1000)}s)`); } }
    }
    return text;
  } catch (e) {
    if (signal && signal.aborted) throw e;
    if (e && e.code === "device-stall") throw e;
    if (ac.signal.aborted) { const got = devSalvage(text); if (got) return got; throw aiErr("device-stall", `${devLabel()} stopped answering.`); }
    throw e;
  } finally { clearInterval(dog); if (signal) signal.removeEventListener("abort", stop); }
}
/* Getting the model ready ahead of time: when a screen that makes something with AI opens (Flashcards, Photo to Note), the model
   loads while the student picks files, instead of after they press Create; that first load is most of the wait the first time.
   With the instructions it will use (sys), they're read now too. Nothing is downloaded: only a model already on the computer. */
function devPrewarm(sys){
  try {
    if (!devAllowed() || aiCfg().provider !== "device" || DEVAI.status !== "available") return;
    // (the instructions exactly as aiCall sends them: the student's area of study and the copying rule added, then the device's tail)
    if (sys) { try { if (window.SBAREA) sys = SBAREA.aiSystem(sys); } catch (e) {} sys = aiCopyRule(sys, "cards"); }
    if (DEVAI.kind === "chrome") { if (sys) devSession(String(sys) + DEV_TAIL, false).then(x => x.destroy(), () => {}); else self.LanguageModel.create(devOpts(false)).then(x => setTimeout(() => { try { x.destroy(); } catch (e) {} }, 60000), () => {}); }
    else if (DEVAI.kind === "webllm") webEngine().then(() => webRest(), () => {});
    else if (DEVAI.kind === "litert") e4bWorker().then(() => e4bRest(), () => {});
  } catch (e) {}
}
/* Before Chrome's (or Edge's) one-time download: a short question, from the first AI button. Yes starts the download in the
   background (the message at the bottom shows its progress) and the request carries on once it's ready; remembered after that. */
const DEV_OK = "studyboard:devAIOk";
function devAsk(){
  return new Promise(done => {
    const edge = devBrowser() === "Edge", who = edge ? "Microsoft's AI built into Edge" : "Google's AI built into Chrome";
    const d = document.createElement("dialog"); d.className = "ai-consent dev-ai-ask"; d.setAttribute("aria-labelledby", "devAskT");
    d.innerHTML = `<div class="sheet"><div class="sheet-head"><h2 id="devAskT">Turn On Free AI?</h2></div>
      <div class="sheet-body"><p style="margin:0">Studyboard uses ${who}. ${edge ? "Edge" : "Chrome"} downloads it once, in the background. It's free and private: what you add stays on this computer.</p></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-no>Not Now</button><button type="button" class="btn primary" data-yes>Turn On</button></div></div>`;
    const fin = v => { try { d.close(); } catch (e) {} d.remove(); done(v); };
    d.addEventListener("cancel", e => { e.preventDefault(); fin(null); });
    // the download starts inside the click itself: Chrome only allows it from a tap
    d.querySelector("[data-yes]").addEventListener("click", () => { devLs.set(DEV_OK, "1"); const w = devWarm(); fin(w || null); });
    d.querySelector("[data-no]").addEventListener("click", () => fin(null));
    document.body.appendChild(d); d.showModal();
    setTimeout(() => { const b = d.querySelector("[data-yes]"); if (b) b.focus(); }, 30);
  });
}
async function devChrome({sys, parts, json, out, signal, onStatus, onPartial, auto, pics}){
  const L = devLabel();
  if (DEVAI.status !== "available") {
    if (auto) throw aiErr("auto-off", `${L} isn't ready yet.`);
    // (a student who had it before, until Chrome removed it, already said yes)
    let w = devLs.get(DEV_OK) || devLs.get(DEV_HAD) ? devWarm() : null;
    // just said Not Now (the quiz after the cards, the next part): not asked again in the same go
    if (!w && !DEVAI.warm && Date.now() - (DEVAI.notNow || 0) < 90000) throw aiErr("no-consent", `${L} wasn't turned on. You can turn it on any time from an AI button, or add a free key in Settings, AI Features.`);
    if (!w && !DEVAI.warm) {
      w = await devAsk();
      if (!w && !devLs.get(DEV_OK)) DEVAI.notNow = Date.now();
      if (!w && !devLs.get(DEV_OK) && !DEVAI.warm) throw aiErr("no-consent", `${L} wasn't turned on. You can turn it on any time from an AI button, or add a free key in Settings, AI Features.`);
    }
    w = w || DEVAI.warm;
    if (!w) throw aiErr("device-tap", `${L} needs a one-time download first. Tap the button again to start it.`);
    const tick = () => onStatus && onStatus(`${DEVAI.why === "removed" ? `Chrome removed ${L} to free up disk space, so it's downloading again` : `Getting ${L} ready on this computer (one time only)`}${DEVAI.progress ? `: ${Math.round(DEVAI.progress * 100)}%` : "…"}`);
    tick(); const iv = setInterval(tick, 1000);
    try { if (!(await w)) { await devProbe(); throw aiErr("device-failed", DEVAI.why === "removed-full" || DEVAI.why === "cant" ? devWhyText() : `${L} couldn't finish downloading. Check your connection and that there's at least 22 GB free, then try again.`); } } finally { clearInterval(iv); }
  }
  let s;
  try { s = await devSession(sys, pics, signal); }
  catch (e) { if (signal && signal.aborted) throw aiErr("aborted", "Stopped."); devProbe(); throw Object.assign(aiErr("device-failed", `${L} couldn't start. Try again in a moment.`), {detail: String(e && e.message || e)}); }
  try {
    const content = () => parts.map(p => p.inline_data ? {type: "image", value: devBlob(p.inline_data.data, p.inline_data.mime_type)} : {type: "text", value: p.text});
    const room = () => Math.max(800, (Number(s.contextWindow || s.inputQuota) || 6000) - (Number(s.contextUsage || s.inputUsage) || devTokens(sys)) - out - devTokens(JSON.stringify(json)) - (pics ? 300 : 0));
    let truncated = devFit(parts, room());
    for (let tries = 0; ; tries++) {
      try {
        // every request is streamed with the stall watchdog (not only ones showing progress): one stuck request would otherwise hold up
        // every request after it, since they go one at a time
        const text = typeof s.promptStreaming === "function" ? await devStream(s, content(), json, signal, onStatus, onPartial)
          : await Promise.race([s.prompt([{role: "user", content: content()}], {responseConstraint: json, signal}), new Promise((_, no) => setTimeout(() => no(aiErr("device-stall", `${L} stopped answering.`)), DEV_MAX_MS))]);
        const data = aiParseJson(text);
        if (data == null || typeof data !== "object") throw aiErr("bad", `${L} sent back something Studyboard couldn't read. Try again.`);
        return {data, model: "chrome-built-in", provider: "device", truncated};
      } catch (e) {
        if (signal && signal.aborted) throw aiErr("aborted", "Stopped.");
        // too long after all: cut a third more and try again
        if (e && (e.name === "QuotaExceededError" || /quota|too large|context/i.test(e.message || "")) && tries < 2) { truncated = devFit(parts, Math.floor(room() * (0.66 - tries * 0.2))) || truncated; continue; }
        // stalled: once more, on a fresh session (not a copy), before giving up on this request
        if (e && e.code === "device-stall" && tries < 1) { try { s.destroy(); } catch (x) {} s = await self.LanguageModel.create(Object.assign(devOpts(pics), {initialPrompts: [{role: "system", content: sys}], signal})); continue; }
        if (e && e.code) throw e;
        throw Object.assign(aiErr(/NotSupported|language/i.test((e && e.name) + (e && e.message)) ? "device-lang" : "device-failed", /NotSupported|language/i.test((e && e.name) + (e && e.message)) ? `${L} doesn't read this language yet.` : `${L} couldn't answer that. Try again.`), {detail: String(e && e.message || e)});
      }
    }
  } finally { try { s.destroy(); } catch (e) {} }
}
async function devApple({sys, parts, json, out, temperature, signal, auto}){
  const N = devNative(), L = devLabel();
  if (!N) throw aiErr("device-failed", `${L} isn't available.`);
  if (DEVAI.status !== "available") { await devProbe(); if (DEVAI.status !== "available") throw aiErr(auto ? "auto-off" : "device-failed", DEVAI.status === "downloading" ? `${L} is still getting ready on this device. Try again in a few minutes.` : `${L} isn't turned on. Turn on Apple Intelligence in Settings, then try again.`); }
  // The context holds the instructions, the request and the answer together
  const room = () => Math.max(500, DEVAI.ctx - devTokens(sys) - out - Math.ceil(devTokens(JSON.stringify(json)) * 0.6) - 150);
  let truncated = devFit(parts, room());
  for (let tries = 0; ; tries++) {
    if (signal && signal.aborted) throw aiErr("aborted", "Stopped.");
    const prompt = parts.filter(p => p.text != null).map(p => p.text).join("\n\n"), images = parts.filter(p => p.inline_data).map(p => p.inline_data.data);
    let r;
    try { r = await N.generate({system: sys, prompt, schema: json, temperature: temperature == null ? 0.3 : Math.min(0.7, temperature), maxTokens: out, images}); }
    catch (e) {
      const code = String((e && (e.code || e.message)) || "");
      if (/context/i.test(code) && tries < 2) { truncated = devFit(parts, Math.floor(room() * (0.66 - tries * 0.2))) || truncated; continue; }
      if (/guardrail|refus/i.test(code)) throw aiErr("device-refused", `${L} wouldn't answer that. Try rewording it.`);
      if (/language|locale/i.test(code)) throw aiErr("device-lang", `${L} doesn't read this language yet.`);
      if (/rate|busy|concurrent/i.test(code) && tries < 2) { await new Promise(res => setTimeout(res, 1500)); continue; }
      throw Object.assign(aiErr("device-failed", `${L} couldn't answer that. Try again.`), {detail: code});
    }
    const data = aiParseJson(r && (r.json || r.text));
    if (data == null || typeof data !== "object") throw aiErr("bad", `${L} sent back something Studyboard couldn't read. Try again.`);
    return {data, model: "apple-on-device", provider: "device", truncated};
  }
}
/* A web page's text, for the AI on this device (which can't browse): the iPhone app fetches the page itself (iOS doesn't stop an app
   reading other sites) and extracts its text here; everywhere else, and if that fails, the website's /api/page-text does it
   (cloudflare/site/page-text.js), as a browser can't fetch another site's page. Both use src/js/01-page-text.js. */
const PAGE_API = "https://studyboardapp.com/api/page-text";
async function devPageText(url, signal){
  const u = SBPAGE.safeUrl(url); if (!u) return {status: "bad"};
  // The iPhone app first opens the page in an invisible browser view on the phone (StudyboardOnDeviceAI.readPage): a real browser on
  // the student's own connection, so pages built by scripts work, and so do sites that only turn away simple readers
  try {
    const N = devNative();
    if (N && typeof N.readPage === "function") {
      const r = await N.readPage({url: u.href});
      if (r && typeof r.html === "string") { const x = SBPAGE.extract(r.html, r.url || u.href); if (x.status === "ok") return Object.assign(x, {url: r.url || u.href, title: x.title || r.title || ""}); }
    }
  } catch (e) { const c = String((e && (e.code || e.message)) || ""); if (/^(paywall|pdf)$/.test(c)) return {status: c}; }
  try {
    const C = window.Capacitor, H = C && C.isNativePlatform && C.isNativePlatform() && C.getPlatform && C.getPlatform() === "ios" && C.Plugins && C.Plugins.CapacitorHttp;
    if (H && typeof H.get === "function") {
      const r = await H.get({url: u.href, headers: {"Accept": "text/html,text/plain;q=0.9"}, responseType: "text", connectTimeout: 10000, readTimeout: 10000});
      const type = String((r.headers && (r.headers["Content-Type"] || r.headers["content-type"])) || "");
      if (r.status === 401 || r.status === 402) return {status: "paywall", url: r.url || u.href};
      if (r.status >= 200 && r.status < 300 && typeof r.data === "string") {
        if (/application\/pdf/i.test(type)) return {status: "pdf"};
        const x = /text\/plain/i.test(type) ? {status: SBPAGE.words(r.data) >= 40 ? "ok" : "empty", title: "", text: r.data.slice(0, SBPAGE.MAX_TEXT)} : SBPAGE.extract(r.data.slice(0, SBPAGE.MAX_HTML), r.url || u.href);
        if (x.status === "ok") return Object.assign(x, {url: r.url || u.href});
      }
    }
  } catch (e) {}
  if (signal && signal.aborted) throw aiErr("aborted", "Stopped.");
  // the website itself asks its own address; the apps ask the website
  const api = /^https?:$/.test(location.protocol) && !/^(capacitor|app):/.test(location.protocol) && location.hostname !== "localhost" || window.__SB_TEST ? "/api/page-text" : PAGE_API;
  try {
    const res = await fetch(`${api}?url=${encodeURIComponent(u.href)}`, {signal, credentials: "omit"});
    if (res.status === 429) return {status: "busy"};
    const j = await res.json().catch(() => ({}));
    return j && j.status ? j : {status: "unreachable"};
  } catch (e) { if (signal && signal.aborted) throw aiErr("aborted", "Stopped."); return {status: "offline"}; }
}
// AI Features: get the free AI after saying Not Now (or ahead of time)
async function webGet(onStatus){ devLs.set(WEB_DECLINED, ""); if (DEVAI.status === "declined") DEVAI.status = "downloadable"; await webEngine(onStatus); webRest(); try { scheduleRender(); } catch (e) {} }
hook("act", act => {
  if (act !== "web-ai-get") return false;
  const msg = () => document.getElementById("webAiMsg"), b = document.querySelector('[data-act="web-ai-get"]');
  if (b) b.disabled = true;
  webGet(t => { const m = msg(); if (m) m.textContent = t; })
    .then(() => { const m = msg(); if (m) m.textContent = "Ready. The AI features now use it."; toast("Free AI is ready on this computer"); try { aiSetupSheet(false); } catch (e) {} })
    .catch(e => { if (b) b.disabled = false; const m = msg(); if (m) m.textContent = "Couldn't download it: " + webErrText(e).slice(0, 120) + ". Try again, or add a free key below."; });
  return true;
});
if (window.__SB_TEST) window.__sbDevAI = {state: DEVAI, probe: devProbe, fit: devFit, webGet, cfg: () => aiCfg(), call: o => aiCall(o)};
