/* ===== module: 49-errreport.js ===== */
/* Anonymous crash and error reports */
const APP_VERSION = "1.15.0";
const BUILD_ID = "dev";
const ERROR_REPORTING = {
  dsn: "",
  environment: "production",
  release: APP_VERSION,
  supabaseFallback: false
};
/*ERRREPORT-START*/
const ERRCORE = (() => {
  // The same secret patterns as the bug-report scrubber (ERRLOG above)
  const KEY_RE = /AIza[\w-]{20,}|sk-[\w-]{16,}|sb_(?:secret|publishable)_[\w-]+|eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{5,}|(?:ghp|gho|github_pat|xox[a-z])[_-][\w-]{16,}|(key|token|apikey|authorization|bearer|secret|password)([=:\s]+)[\w.~+\/-]{8,}/gi;
  const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
  const URL_RE = /\b(?:https?|app|capacitor|file|blob|ionic|chrome-extension|moz-extension|safari-web-extension):\/\/[^\s"'<>)\]]+/gi;
  const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
  const API_HOST = /(^|\.)(supabase\.co|googleapis\.com|anthropic\.com|openai\.com|jsdelivr\.net|sentry\.io)$/i;
  const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tag = v => String(v == null ? "" : v).replace(/[^\w.-]/g, "").slice(0, 40);
  const hex = n => { let s = ""; try { const a = new Uint8Array(n); crypto.getRandomValues(a); a.forEach(b => { s += (b + 256).toString(16).slice(1); }); } catch (e) { for (let i = 0; i < n; i++) s += (Math.floor(Math.random() * 256) + 256).toString(16).slice(1); } return s; };
  const newId = () => hex(16);

  // A list of strings (task titles, course names, the user id...) that must never appear
  function redactor(list){
    const w = [...new Set((list || []).map(x => String(x == null ? "" : x).trim()).filter(x => x.length >= 4))].sort((a, b) => b.length - a.length).slice(0, 400);
    return w.length ? new RegExp(w.map(esc).join("|"), "gi") : null;
  }
  // own: hosts that belong to the app (location.host)
  function scrubUrl(u, own){
    try {
      const x = new URL(String(u).replace(/[.,;:]+$/, ""));
      const seg = x.pathname.split("/").map(p => /^[0-9a-f-]{16,}$/i.test(p) || /^\d{5,}$/.test(p) ? ":id" : p.slice(0, 40)).join("/");
      if (x.protocol === "file:") return "file:///" + (x.pathname.split("/").pop() || "").slice(0, 40);
      if (/^(app|capacitor|ionic):$/.test(x.protocol)) return x.protocol + "//" + x.host + seg;
      if (/^(chrome|moz|safari-web)-?extension:$|^safari-web-extension:$/.test(x.protocol)) return "[extension-url]";
      if ((own || []).includes(x.host)) return x.protocol + "//" + x.host + seg;
      if (API_HOST.test(x.hostname)) return x.protocol + "//" + x.hostname;
      return "[external-url]";
    } catch (e) { return "[url]"; }
  }
  // Free text to safe text
  function scrubText(s, cap, red, own){
    let t = String(s == null ? "" : s);
    if (red) t = t.replace(red, "[hidden]");
    t = t.replace(URL_RE, m => scrubUrl(m, own)).replace(KEY_RE, "[hidden]").replace(EMAIL_RE, "[email]")
      .replace(UUID_RE, "[id]").replace(/\b[A-Za-z0-9_-]{32,}\b/g, "[id]")
      .replace(/[A-Za-z]:\\[^\s"'<>]+/g, "[path]").replace(/(^|[\s(\[\]=,'"])\/(?:[^\s\/"'<>:()\[\]]+\/?){2,}/g, "$1[path]")
      .replace(/(?:[\w-]+ ){0,3}[\w-]+\.(?:docx?|pdf|pptx?|xlsx?|txt|rtf|png|jpe?g|gif|heic|webp|csv|md|zip|ics|pages|numbers|key|odt)\b/gi, "[file]")
      .replace(/(["'`])((?:(?!\1)[^\n]){0,300})\1/g, (m, q, body) => /^[A-Za-z_$][\w$.\-]{0,40}$/.test(body) ? m : q + "…" + q)
      .replace(/[\r\n\t]+/g, " ");
    return t.slice(0, cap || 240);
  }
  // Chrome ("at fn (url:1:2)") and Firefox/Safari ("fn@url:1:2") stacks to Sentry frames
  function parseStack(stack, own){
    const frames = [];
    String(stack || "").split("\n").slice(0, 80).forEach(line => {
      line = line.trim();
      let m = /^at (?:(.*?) \()?(.+?):(\d+):(\d+)\)?$/.exec(line), fn, file, ln, col;
      if (m) { fn = m[1] || ""; file = m[2]; ln = m[3]; col = m[4]; }
      else if ((m = /^(.*?)@(.+?):(\d+):(\d+)$/.exec(line))) { fn = m[1]; file = m[2]; ln = m[3]; col = m[4]; }
      else return;
      file = file.replace(/^async /, "");
      let name, inApp = false;
      if (/\beval at\b|^<anonymous>$|^native$/.test(file)) name = "<anonymous>";
      else if (/^[a-z][\w+.-]+:/i.test(file)) {
        const s = scrubUrl(file, own);
        if (/^\[/.test(s)) name = s;
        else { name = (s.split("/").pop() || "index.html").slice(0, 40); inApp = true; }
      } else { name = file.split(/[\\/]/).pop().slice(0, 40).replace(/[^\w.<>-]/g, "") || "<anonymous>"; inApp = !/^</.test(name); }
      frames.push({"function": String(fn || "").replace(/^async /, "").replace(/[^\w$.<>\s\[\]]/g, "").trim().slice(0, 80) || "?", filename: name, lineno: +ln, colno: +col, in_app: inApp});
    });
    return frames.slice(0, 30).reverse();
  }
  const djb = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(16).padStart(8, "0"); };
  // Same bug, same fingerprint
  function fingerprint(type, frames, message){
    const top = (frames || []).slice(-3).map(f => f["function"] + "@" + f.filename + ":" + f.lineno).join("|");
    return djb(String(type) + "|" + (top || String(message || "").replace(/(["'`]).*?\1/g, "").replace(/\d+/g, "#").slice(0, 80)));
  }
  // Errors that are noise or that are not ours
  function ignore(info, opt){
    opt = opt || {};
    const msg = String(info.message || ""), type = String(info.type || ""), st = String(info.stack || ""), file = String(info.filename || "");
    if (/ResizeObserver loop/i.test(msg)) return "resize-observer";
    if (/^Script error\.?$/i.test(msg.trim())) return "cross-origin";
    if (/extension:\/\//i.test(st + " " + file + " " + msg)) return "extension";
    if (type === "AbortError" || /\babort(ed)?\b.*\b(request|signal|fetch|operation)|\b(request|signal|fetch|operation)\b.*\babort(ed)?\b|The user aborted/i.test(msg)) return "aborted";
    if (/^(Failed to fetch|Load failed|NetworkError when attempting to fetch resource\.?|Network request failed|fetch failed|The network connection was lost\.?|The Internet connection appears to be offline\.?)$/i.test(msg.trim())) return opt.online === false ? "offline" : "network";
    if (/Non-Error promise rejection captured|ChunkLoadError|Loading chunk/i.test(msg)) return "noise";
    if (st) { const fr = parseStack(st, opt.own); if (fr.some(f => /^\[/.test(f.filename)) && !fr.some(f => f.in_app)) return "third-party"; }
    if (file && /^https?:/i.test(file) && opt.own && opt.own.length) { try { if (!opt.own.includes(new URL(file).host)) return "third-party"; } catch (e) {} }
    return "";
  }
  function parseDsn(dsn){
    const m = /^https:\/\/([A-Za-z0-9]{8,64})(?::[^@\/\s]*)?@([A-Za-z0-9.-]+(?::\d{1,5})?)((?:\/[\w.-]+)*)\/(\d{1,20})$/.exec(String(dsn || "").trim());
    if (!m) return null;
    const pub = `https://${m[1]}@${m[2]}${m[3]}/${m[4]}`;
    return {dsn: pub, key: m[1], host: m[2], path: m[3], project: m[4],
      url: `https://${m[2]}${m[3]}/api/${m[4]}/envelope/?sentry_key=${m[1]}&sentry_version=7&sentry_client=studyboard-errreport%2F1`};
  }
  // Whitelisted breadcrumbs only
  const CRUMB = {nav: /^[a-z][a-z0-9-]{0,23}$/, act: /^[a-z][a-z0-9-]{0,39}$/, sheet: /^open$/, sync: /^(start|ok|fail|retry)$/, error: /^[A-Za-z][\w$.]{0,40}$/};
  function addCrumb(buf, cat, msg, nowMs, cap){
    if (!CRUMB[cat] || typeof msg !== "string" || !CRUMB[cat].test(msg)) return buf;
    buf.push({timestamp: Math.round((nowMs || Date.now()) / 1000), category: cat, message: msg, level: "info"});
    while (buf.length > (cap || 20)) buf.shift();
    return buf;
  }
  function buildEvent(raw, ctx){
    ctx = ctx || {};
    const red = ctx.redact instanceof RegExp ? ctx.redact : redactor(ctx.redact), now = ctx.now || Date.now();
    const frames = parseStack(raw.stack, ctx.own);
    const type = String(raw.type || "Error").replace(/[^\w$.]/g, "").slice(0, 60) || "Error";
    const value = scrubText(raw.message, 240, red, ctx.own);
    const tags = {kind: tag(raw.kind) || "error", platform: tag(ctx.platform) || "web", build: tag(ctx.build), pro: ctx.pro ? "yes" : "no", theme: tag(ctx.theme), dark: tag(ctx.dark), sw: tag(ctx.sw)};
    Object.keys(raw.tags || {}).slice(0, 4).forEach(k => { tags[tag(k)] = tag(raw.tags[k]); });
    const fp = fingerprint(type, frames, value);
    const ex = {type, value, mechanism: {type: tags.kind, handled: false}};
    if (frames.length) ex.stacktrace = {frames};
    return {event_id: newId(), timestamp: now / 1000, platform: "javascript", level: /^(fatal|error|warning|info)$/.test(raw.level) ? raw.level : "error",
      release: tag(ctx.release), environment: tag(ctx.environment) || "production", exception: {values: [ex]}, tags, fingerprint: [fp],
      user: {id: /^[0-9a-f]{8,32}$/.test(ctx.anon || "") ? ctx.anon : undefined},
      breadcrumbs: {values: (ctx.crumbs || []).slice(-20)}, contexts: {app: {app_version: tag(ctx.release), build: tag(ctx.build)}}, sdk: {name: "studyboard.errreport", version: "1"}};
  }
  // Final safety net over the whole event, then a size cap
  function finish(ev){
    const clean = o => JSON.parse(JSON.stringify(o).replace(KEY_RE, "[hidden]").replace(EMAIL_RE, "[email]"));
    let e = clean(ev), s = JSON.stringify(e);
    if (s.length > 24000) { e.breadcrumbs = {values: []}; s = JSON.stringify(e); }
    if (s.length > 24000 && e.exception.values[0].stacktrace) { e.exception.values[0].stacktrace.frames = e.exception.values[0].stacktrace.frames.slice(-10); }
    return e;
  }
  // The Sentry envelope
  function envelope(event, dsn, sentAt){
    const payload = JSON.stringify(event), len = typeof TextEncoder === "function" ? new TextEncoder().encode(payload).length : payload.length;
    return [JSON.stringify({event_id: event.event_id, dsn: dsn.dsn, sent_at: sentAt || new Date().toISOString(), sdk: event.sdk}),
      JSON.stringify({type: "event", content_type: "application/json", length: len}), payload].join("\n") + "\n";
  }
  // At most `maxSession` events a session, `perFp` per fingerprint per hour
  function makeLimiter(o){
    o = o || {};
    const max = o.maxSession || 20, perFp = o.perFp || 3, now = o.now || Date.now, rnd = o.random || Math.random;
    let total = 0, fails = 0, until = 0; const seen = new Map();
    return {
      allow(id, kind){
        if (total >= max) return false;
        if (kind === "console" && rnd() > 0.5) return false;
        const list = (seen.get(id) || []).filter(t => now() - t < 36e5);
        if (list.length >= perFp) { seen.set(id, list); return false; }
        list.push(now()); seen.set(id, list); total++; return true;
      },
      fail(){ fails++; until = now() + this.delay(); },
      ok(){ fails = 0; until = 0; },
      delay(){ return fails ? Math.min(36e5, 3e4 * Math.pow(2, fails - 1)) : 0; },
      blocked(){ return now() < until; },
      count: () => total
    };
  }
  const enqueue = (q, item, cap) => { const n = q.concat([item]); return n.slice(Math.max(0, n.length - (cap || 20))); };
  // An explicit choice wins; otherwise on
  const decideEnabled = o => o && o.stored === "on" ? true : o && o.stored === "off" ? false : !(o && (o.gpc === true || o.dnt === true));
  return {KEY_RE, newId, redactor, scrubUrl, scrubText, parseStack, fingerprint, ignore, parseDsn, addCrumb, buildEvent, finish, envelope, makeLimiter, enqueue, decideEnabled, tag};
})();
/*ERRREPORT-END*/
(() => {
  const CFG = ERROR_REPORTING, PREF = "studyboard:errrep", IDK = "studyboard:errid", QK = "studyboard:errq";
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} };
  const dsn = ERRCORE.parseDsn(CFG.dsn), lim = ERRCORE.makeLimiter();
  const flag = f => { try { return f(); } catch (e) { return false; } };
  const enabled = () => ERRCORE.decideEnabled({stored: lsGet(PREF), gpc: flag(() => navigator.globalPrivacyControl === true),
    dnt: flag(() => navigator.doNotTrack === "1" || navigator.doNotTrack === "yes" || window.doNotTrack === "1" || navigator.msDoNotTrack === "1")});
  const sv = () => { try { const c = sbConfig() || (SB_HOSTED ? SB_DEFAULT : null); return c && c.url && c.key ? {url: String(c.url).replace(/\/+$/, ""), key: c.key} : null; } catch (e) { return null; } };
  const target = () => { if (dsn) return {url: dsn.url}; const s = CFG.supabaseFallback && sv(); return s ? {url: s.url + "/functions/v1/error-ingest", key: s.key} : null; };
  const platform = () => DESK ? "electron" : flag(() => window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ? "ios-wrapper"
    : flag(() => matchMedia("(display-mode: standalone)").matches || navigator.standalone) ? "pwa" : "web";
  const own = () => { try { return location.host ? [location.host] : []; } catch (e) { return []; } };
  const anon = () => { let a = lsGet(IDK); if (!/^[0-9a-f]{16}$/.test(a || "")) { a = ERRCORE.newId().slice(0, 16); lsSet(IDK, a); } return a; };
  let swVer = "none", busy = false, pumping = false, dead = 0, lastTab = "", timer = 0;
  let q = []; try { const j = JSON.parse(lsGet(QK) || "[]"); if (Array.isArray(j)) q = j.filter(x => x && x.event_id).slice(-20); } catch (e) {}
  const saveQ = () => lsSet(QK, q.length ? JSON.stringify(q) : null);
  const crumbs = [], seen = new WeakSet();
  const crumb = (c, m) => { try { ERRCORE.addCrumb(crumbs, c, String(m), Date.now(), 20); } catch (e) {} };
  function secrets(){
    const l = [];
    try { if (sbUser) l.push(sbUser.id, sbUser.email); } catch (e) {}
    try { Object.values(state.tasks || {}).slice(0, 300).forEach(t => l.push(t.title, t.notes)); Object.values(state.courses || {}).slice(0, 100).forEach(c => l.push(c.name, c.code)); } catch (e) {}
    try { Object.values(state.notes || {}).slice(0, 100).forEach(n => l.push(n.title)); } catch (e) {}
    try { Object.values(state.events || {}).slice(0, 200).forEach(ev => l.push(ev.title, ev.location)); Object.values(state.decks || {}).slice(0, 100).forEach(d => l.push(d.name, d.title)); Object.values(state.files || {}).slice(0, 200).forEach(f => l.push(f.name, f.title)); } catch (e) {}
    return l.filter(x => typeof x === "string" && x.trim()).map(x => x.length <= 200 ? x : x.trim().slice(0, 60));
  }
  function context(){
    let pro = false, theme = "classic", dark = "";
    try { pro = !!(window.StudyboardPlan && window.StudyboardPlan.tier() === "pro"); } catch (e) {}
    try { theme = document.documentElement.dataset.skin || "classic"; dark = document.documentElement.dataset.theme || ""; } catch (e) {}
    return {release: CFG.release, environment: CFG.environment, build: BUILD_ID, platform: platform(), pro, theme, dark, sw: swVer, anon: anon(), own: own(), redact: secrets(), crumbs: crumbs.slice()};
  }
  function normalize(kind, err, extra){
    const o = {kind, tags: extra && extra.tags};
    if (err instanceof Error || (err && typeof err === "object" && (err.stack || err.name))) { o.type = err.name || (err.constructor && err.constructor.name) || "Error"; o.message = err.message; o.stack = err.stack; }
    else if (err && typeof err === "object") { o.type = "Error"; o.message = err.message; o.filename = err.filename; if (err.filename && err.lineno) o.stack = `at <anonymous> (${err.filename}:${err.lineno}:${err.colno || 0})`; }
    else { o.type = kind === "promise" ? "UnhandledRejection" : kind === "console" ? "ConsoleError" : "Error"; o.message = err; }
    if (extra && extra.type) o.type = extra.type;
    if (extra && extra.prefix) o.message = extra.prefix + (o.message ? ": " + o.message : "");
    return o;
  }
  /* Sending: queue first (so offline and failures keep it), then a background pump */
  async function send(ev){
    const tg = target(); if (!tg) return "drop";
    let body, headers;
    if (dsn) { body = ERRCORE.envelope(ev, dsn); headers = {"Content-Type": "text/plain;charset=UTF-8"}; }
    else { body = JSON.stringify({v: 1, event: ev}); headers = {"Content-Type": "application/json", apikey: tg.key}; }
    try {
      const r = await fetch(tg.url, {method: "POST", body, headers, keepalive: body.length < 60000, credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store"});
      return r.ok ? "ok" : (r.status === 429 || r.status >= 500 || r.status === 408) ? "retry" : "drop";
    } catch (e) { return "retry"; }
  }
  async function pump(){
    if (pumping || dead >= 3 || !enabled() || !target() || navigator.onLine === false || lim.blocked()) return;
    pumping = true;
    try {
      while (q.length && enabled()) {
        const r = await send(q[0]);
        if (r === "retry") { lim.fail(); break; }
        q.shift(); saveQ();
        if (r === "ok") { lim.ok(); dead = 0; } else if (++dead >= 3) { q = []; saveQ(); break; }
      }
    } catch (e) {}
    pumping = false;
    if (q.length && dead < 3) { clearTimeout(timer); timer = setTimeout(pump, Math.max(lim.delay(), 2000)); }
  }
  /* Reporting */
  function report(kind, err, extra){
    if (busy) return;
    busy = true;
    try {
      if (err && typeof err === "object") { if (seen.has(err)) return; seen.add(err); }
      const info = normalize(kind, err, extra);
      if (/^flow/.test(kind)) { try { ERRLOG.push({t: Date.now(), k: kind, m: ERRCORE.scrubText(info.message, 240, ERRCORE.redactor(secrets()), own())}); if (ERRLOG.length > 15) ERRLOG.shift(); } catch (e) {} }
      if (dead >= 3 || !enabled() || !target()) return;
      if (navigator.onLine === false && /^flow-(sync|ai)/.test(kind)) return;
      if (ERRCORE.ignore(info, {online: navigator.onLine !== false, own: own()})) return;
      const ev = ERRCORE.finish(ERRCORE.buildEvent(info, context()));
      if (!lim.allow(ev.fingerprint[0], kind)) return;
      q = ERRCORE.enqueue(q, ev, 20); saveQ();
      setTimeout(pump, 0);
    } catch (e) {} finally { busy = false; }
  }
  const flow = (name, err, extra) => report("flow-" + ERRCORE.tag(name), err || new Error(name + " failed"), Object.assign({prefix: ERRCORE.tag(name)}, extra));
  window.addEventListener("error", e => { if (e.target && e.target !== window) return; report("error", e.error || {message: e.message, filename: e.filename, lineno: e.lineno, colno: e.colno}); });
  window.addEventListener("unhandledrejection", e => report("promise", e.reason));
  const ce = console.error;
  console.error = function(...a){
    try { if (!busy) { const er = a.find(x => x instanceof Error), s = a.map(x => typeof x === "string" ? x : "").join(" ").trim(); if (er || s) report("console", er || s); } } catch (e) {}
    return ce.apply(this, a);
  };
  window.addEventListener("online", () => setTimeout(pump, 2000));
  document.addEventListener("click", e => { try { const a = e.target && e.target.closest && e.target.closest("[data-act]"); if (a) crumb("act", a.getAttribute("data-act")); } catch (x) {} }, true);
  try { if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", e => {
    const m = e.data; if (!m || typeof m !== "object") return;
    if (m.type === "sb-sw-info") swVer = ERRCORE.tag(m.v);
    else if (m.type === "sb-sw-error") report("sw", {name: m.name, message: m.msg, stack: m.stack}, {type: "ServiceWorkerError"});
  }); } catch (e) {}
  const wrap = (get, set, fn) => { try { set(fn(get())); } catch (e) {} };
  wrap(() => render, f => { render = f; }, orig => function(){
    if (ui.tab !== lastTab) { lastTab = ui.tab; crumb("nav", ui.tab); }
    try { return orig.apply(this, arguments); } catch (e) { flow("render", e); throw e; }
  });
  wrap(() => openSheet, f => { openSheet = f; }, orig => function(){ crumb("sheet", "open"); return orig.apply(this, arguments); });
  wrap(() => aiCall, f => { aiCall = f; }, orig => async function(){
    try { return await orig.apply(this, arguments); }
    catch (e) { if (!e || !e.code || /^(bad|http|busy|long|blocked)$/.test(e.code)) flow("ai", e, e && e.code ? {tags: {code: e.code}} : null); throw e; }
  });
  hook("boot", () => {
    try { if (navigator.serviceWorker && navigator.serviceWorker.controller) navigator.serviceWorker.controller.postMessage({type: "sb-sw-ping"}); } catch (e) {}
    try { if (DESK && DESK.setCrashReports) DESK.setCrashReports(enabled()); } catch (e) {}
    setTimeout(pump, 6000);
  });
  function setEnabled(on){
    lsSet(PREF, on ? "on" : "off");
    if (!on) { q = []; saveQ(); lsSet(IDK, null); }
    try { if (DESK && DESK.setCrashReports) DESK.setCrashReports(!!on); } catch (e) {}
  }
  const configured = () => !!target();
  window.SBERR = {flow, crumb, enabled, setEnabled, configured, report, pending: () => q.length,
    scrub: m => { try { return ERRCORE.scrubText(m, 240, ERRCORE.redactor(secrets()), own()); } catch (e) { return "[hidden]"; } }};
  hook("menu", () => {
    const on = enabled();
    return `<button data-act="errrep-toggle" data-group="app" role="switch" aria-checked="${on}"><span>Send Anonymous Crash Reports<span class="sub">${on ? "On. When Studyboard hits an error it can send a short, anonymous report (no tasks, notes, courses or account details). Tap to turn off." : "Off. Nothing is sent when something breaks. Tap to turn on and help us fix bugs."}</span></span></button>`;
  });
  hook("act", act => {
    if (act !== "errrep-toggle") return false;
    const on = !enabled(); setEnabled(on);
    toast(on ? "Anonymous crash reports are on" : "Anonymous crash reports are off");
    setTimeout(menuSheet, 40);
    return true;
  });
})();


