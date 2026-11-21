/* ===== 01-ai-device.js: AI that runs on the student's own device, with nothing to set up.
   Chrome: the built-in Prompt API (window.LanguageModel, Gemini Nano; desktop Chrome 148 and later).
   iPhone and iPad app: Apple's on-device model, through the StudyboardOnDeviceAI plugin (ios-wrapper/native/StudyboardOnDeviceAI.swift).
   Used only when the student has no AI key and no Studyboard AI (aiCfg in 01-ai.js). Nothing leaves the device, so there's no
   consent to ask for, no key and no cost. These models are small, so the study set pipeline gives them short sections, examples,
   and a checking pass (01-ai.js: aiDevCheckCards, aiDevCheckQuiz). ===== */
// var, not const: aiCfg can ask about it while the bundle is still loading
var DEVAI = {kind: "", status: "", images: false, ctx: 0, progress: 0, warm: null, probing: null};
const DEV_LANGS = ["en", "es", "de", "fr", "ja"];
const devLangs = () => { const l = String(navigator.language || "en").slice(0, 2).toLowerCase(); return l !== "en" && DEV_LANGS.includes(l) ? ["en", l] : ["en"]; };
const devOpts = img => ({expectedInputs: [{type: "text", languages: devLangs()}].concat(img ? [{type: "image"}] : []), expectedOutputs: [{type: "text", languages: devLangs()}]});
const devLabel = () => DEVAI.kind === "apple" ? "Apple Intelligence" : "Chrome's built-in AI";
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
      } else DEVAI.status = "";
    } catch (e) { DEVAI.status = "unavailable"; }
    finally { DEVAI.probing = null; if (DEVAI.status !== before) { try { scheduleRender(); } catch (e) {} } }
  })();
  return DEVAI.probing;
}
devProbe();
document.addEventListener("visibilitychange", () => { if (!document.hidden && DEVAI.status && DEVAI.status !== "available") devProbe(); });

/* The first time, Chrome downloads its model (once, for every site). Chrome only starts that download from a click, so a click on
   anything AI starts it, and the request that follows waits for it with a progress line. */
const DEV_AI_ACT = /(^|-)ai(-|$)|hint|explain|first-deck|^fd-|^cp-|companion|quiz|^lec-|^wb-/;
function devWarm(){
  if (DEVAI.kind !== "chrome" || DEVAI.warm || !["downloadable", "downloading"].includes(DEVAI.status)) return DEVAI.warm;
  try { if (navigator.userActivation && !navigator.userActivation.isActive) return null; } catch (e) {}
  DEVAI.warm = self.LanguageModel.create(Object.assign(devOpts(false), {monitor(m){ m.addEventListener("downloadprogress", e => { DEVAI.progress = Number(e.loaded) || 0; try { fire("device-ai-progress", DEVAI.progress); } catch (x) {} }); }}))
    .then(s => { try { s.destroy(); } catch (e) {} DEVAI.status = "available"; DEVAI.progress = 1; try { scheduleRender(); } catch (e) {} return true; })
    .catch(e => { DEVAI.warm = null; return false; });
  return DEVAI.warm;
}
document.addEventListener("click", e => {
  if (!e.isTrusted || DEVAI.kind !== "chrome" || DEVAI.status === "available" || !devUsable()) return;
  const el = e.target && e.target.closest && e.target.closest("[data-act]"); if (!el) return;
  try { const c = aiCfg(); if (c.provider !== "device") return; } catch (x) { return; }
  if (DEV_AI_ACT.test(el.dataset.act || "")) devWarm();
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
const DEV_TAIL = "\n\nAnswer with JSON only, in exactly the requested format. Everything you write must be suitable for a school student.";
// One request at a time: these models answer one thing at a time anyway, and progress lines stay true
let devQueue = Promise.resolve();
function devCall(o){ const run = devQueue.then(() => devRun(o)); devQueue = run.catch(() => {}); return run; }
async function devRun({system, parts, schema, maxTokens, temperature, signal, search, urlContext, onStatus, auto}){
  if (signal && signal.aborted) throw aiErr("aborted", "Stopped.");
  const L = devLabel();
  if (search || urlContext) throw aiErr("device-web", `${L} works offline, so it can't look things up on the web. Studyboard AI or an AI key in Settings, AI Features can.`);
  if (parts.some(p => p && p.file_data)) throw aiErr("device-files", `${L} can't watch videos. Studyboard AI or an AI key in Settings, AI Features can.`);
  const pics = parts.filter(p => p && p.inline_data && /^image\//.test(p.inline_data.mime_type || ""));
  if (parts.some(p => p && p.inline_data && !/^image\//.test(p.inline_data.mime_type || ""))) throw aiErr("device-files", `${L} can't read this file directly (it may be a scan). Studyboard AI or an AI key in Settings, AI Features can.`);
  if (pics.length && !DEVAI.images) throw aiErr("device-files", `${L} on this device can't read pictures. Studyboard AI or an AI key in Settings, AI Features can.`);
  parts = parts.map(p => p && typeof p.text === "string" ? {text: p.text} : p);
  const sys = String(system || "") + DEV_TAIL, json = toJsonSchema(schema || {type: "OBJECT"});
  const out = Math.min(Number(maxTokens) || 1500, 1800);
  if (DEVAI.kind === "apple") return devApple({sys, parts, json: devOrdered(json), out, temperature, signal, auto});
  return devChrome({sys, parts, json, out, signal, onStatus, auto, pics: pics.length > 0});
}
async function devChrome({sys, parts, json, out, signal, onStatus, auto, pics}){
  const L = devLabel();
  if (DEVAI.status !== "available") {
    if (auto) throw aiErr("auto-off", `${L} isn't ready yet.`);
    const w = devWarm();
    if (!w) throw aiErr("device-tap", `${L} needs a one-time download first. Tap the button again to start it.`);
    const tick = () => onStatus && onStatus(`Getting ${L} ready on this computer (one time only)${DEVAI.progress ? `: ${Math.round(DEVAI.progress * 100)}%` : "…"}`);
    tick(); const iv = setInterval(tick, 1000);
    try { if (!(await w)) throw aiErr("device-failed", `${L} couldn't finish downloading. Check your connection and free space, then try again.`); } finally { clearInterval(iv); }
  }
  let s;
  try { s = await self.LanguageModel.create(Object.assign(devOpts(pics), {initialPrompts: [{role: "system", content: sys}], signal})); }
  catch (e) { if (signal && signal.aborted) throw aiErr("aborted", "Stopped."); devProbe(); throw Object.assign(aiErr("device-failed", `${L} couldn't start. Try again in a moment.`), {detail: String(e && e.message || e)}); }
  try {
    const content = () => parts.map(p => p.inline_data ? {type: "image", value: devBlob(p.inline_data.data, p.inline_data.mime_type)} : {type: "text", value: p.text});
    const room = () => Math.max(800, (Number(s.contextWindow || s.inputQuota) || 6000) - (Number(s.contextUsage || s.inputUsage) || devTokens(sys)) - out - devTokens(JSON.stringify(json)) - (pics ? 300 : 0));
    let truncated = devFit(parts, room());
    for (let tries = 0; ; tries++) {
      try {
        const text = await s.prompt([{role: "user", content: content()}], {responseConstraint: json, signal});
        const data = aiParseJson(text);
        if (data == null || typeof data !== "object") throw aiErr("bad", `${L} sent back something Studyboard couldn't read. Try again.`);
        return {data, model: "chrome-built-in", provider: "device", truncated};
      } catch (e) {
        if (signal && signal.aborted) throw aiErr("aborted", "Stopped.");
        // too long after all: cut a third more and try again
        if (e && (e.name === "QuotaExceededError" || /quota|too large|context/i.test(e.message || "")) && tries < 2) { truncated = devFit(parts, Math.floor(room() * (0.66 - tries * 0.2))) || truncated; continue; }
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
if (window.__SB_TEST) window.__sbDevAI = {state: DEVAI, probe: devProbe, fit: devFit, cfg: () => aiCfg(), call: o => aiCall(o)};
