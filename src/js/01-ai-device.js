/* ===== 01-ai-device.js: AI that runs on the student's own device, with nothing to set up.
   Chrome: the built-in Prompt API (window.LanguageModel, Gemini Nano; desktop Chrome 148 and later).
   Elsewhere (Edge, Safari, the desktop app, computers Chrome's model doesn't run on): Google's Gemma, run in the browser by WebLLM
   (vendor/webllm-0.2.89) on the graphics chip, downloaded once only after the student agrees.
   iPhone and iPad app: Apple's on-device model, through the StudyboardOnDeviceAI plugin (ios-wrapper/native/StudyboardOnDeviceAI.swift).
   Used only when the student has no AI key and no Studyboard AI (aiCfg in 01-ai.js). Nothing leaves the device, so there's no
   consent to ask for, no key and no cost. These models are small, so the study set pipeline gives them short sections, examples,
   and a checking pass (01-ai.js: aiDevCheckCards, aiDevCheckQuiz). ===== */
// var, not const: aiCfg can ask about it while the bundle is still loading
var DEVAI = {kind: "", status: "", images: false, ctx: 0, progress: 0, warm: null, probing: null};
const DEV_LANGS = ["en", "es", "de", "fr", "ja"];
const devLangs = () => { const l = String(navigator.language || "en").slice(0, 2).toLowerCase(); return l !== "en" && DEV_LANGS.includes(l) ? ["en", l] : ["en"]; };
const devOpts = img => ({expectedInputs: [{type: "text", languages: devLangs()}].concat(img ? [{type: "image"}] : []), expectedOutputs: [{type: "text", languages: devLangs()}]});
// Edge has the same built-in AI interface as Chrome (with Microsoft's own model): it's named as Edge's
const devBrowser = () => { try { const b = navigator.userAgentData && navigator.userAgentData.brands; if (b && b.some(x => /Microsoft Edge/i.test(x.brand))) return "Edge"; } catch (e) {} return /\bEdg\//.test(navigator.userAgent || "") ? "Edge" : "Chrome"; };
const devLabel = () => DEVAI.kind === "apple" ? "Apple Intelligence" : DEVAI.kind === "webllm" ? "Studyboard's on-device AI" : `${devBrowser()}'s built-in AI`;
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
      if (!devAllowed()) { DEVAI.status = ""; return; }
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
    finally { DEVAI.probing = null; if (DEVAI.status !== before) { try { scheduleRender(); } catch (e) {} } }
  })();
  return DEVAI.probing;
}
devProbe();
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
    if (!found) throw aiErr("device-web", `${L} couldn't find anything on the web for that. Studyboard AI or an AI key in Settings, AI Features can search the whole web.`);
    parts = parts.concat({text: found});
    system = String(system || "") + " Use the WEB SOURCES given (and say where a fact comes from); if they don't answer it, say so instead of guessing.";
  }
  if (parts.some(p => p && p.file_data)) throw aiErr("device-files", `${L} can't watch videos. Studyboard AI or an AI key in Settings, AI Features can.`);
  // Photos and PDFs: their words are read on this device first (01-ocr.js), so the model gets text
  parts = await devReadParts(parts, {onStatus, signal, auto});
  const pics = parts.filter(p => p && p.inline_data);
  parts = parts.map(p => p && typeof p.text === "string" ? {text: p.text} : p);
  const sys = String(system || "") + DEV_TAIL, json = toJsonSchema(schema || {type: "OBJECT"});
  const out = Math.min(Number(maxTokens) || 1500, 1800);
  if (DEVAI.kind === "apple") return devApple({sys, parts, json: devOrdered(json), out, temperature, signal, auto});
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
    if (!/^image\//.test(mime)) throw aiErr("device-files", `${L} can't read this kind of file. Studyboard AI or an AI key in Settings, AI Features can.`);
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
    ? `There are no words in that ${what} that this device can read. ${L} works from text, so diagrams and drawings need Studyboard AI or an AI key in Settings, AI Features.`
    : hand ? `That ${what} was too hard to read on this computer (handwriting usually is). Try typed notes or a sharper, brighter photo; the Studyboard iPhone app reads handwriting, and so do Studyboard AI and an AI key.`
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
  const worker = lib.stubWorker ? null : new Worker(webAbs("worker.js"), {type: "module"});
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
async function devStream(s, content, json, signal, onStatus, onPartial){
  let text = "", last = 0, lastChunk = Date.now(), any = false; const t0 = Date.now(), ac = new AbortController();
  const stop = () => ac.abort(); if (signal) signal.addEventListener("abort", stop, {once: true});
  // the watchdog wins the race even if the stream ignores being stopped
  let stalled; const stall = new Promise(r => { stalled = r; });
  const dog = setInterval(() => { if (Date.now() - lastChunk > (any ? DEV_STALL_MS() : DEV_FIRST_MS()) || Date.now() - t0 > DEV_MAX_MS) { ac.abort(); stalled({stall: true}); } }, 500);
  try {
    const stream = s.promptStreaming([{role: "user", content}], {responseConstraint: json, signal: ac.signal}), it = stream[Symbol.asyncIterator]();
    for (;;) {
      const step = await Promise.race([it.next(), stall]);
      if (step.stall) { try { it.return && it.return(); } catch (e) {} throw aiErr("device-stall", `${devLabel()} stopped answering.`); }
      if (step.done) break;
      const chunk = step.value;
      lastChunk = Date.now(); any = true;
      const c = String(chunk == null ? "" : chunk);
      text = c.startsWith(text) && text ? c : text + c;
      if (Date.now() - last > 150) { last = Date.now();
        if (onPartial) { const a = devPartial(text); if (a) onPartial(a); }
        if (onStatus) { const w = (text.replace(/"[a-zA-Z]+"\s*:/g, " ").match(/[A-Za-z0-9\u00C0-\uFFFF]+/g) || []).length; onStatus(`${devLabel()} is writing… ${w} word${w === 1 ? "" : "s"} so far (${Math.round((Date.now() - t0) / 1000)}s)`); } }
    }
    return text;
  } catch (e) {
    if (signal && signal.aborted) throw e;
    if (e && e.code === "device-stall") throw e;
    if (ac.signal.aborted) throw aiErr("device-stall", `${devLabel()} stopped answering.`);
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
