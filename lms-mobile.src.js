/* Studyboard iPhone and Android: school site sign-in and reading (Brightspace, Canvas, Blackboard).
   Built into lms-mobile.js by scripts/build-lms-mobile.js. It gives the page the same six calls the desktop app has
   (connect, sync, file, mail, signOut; feed is left to the server), through the native Capacitor plugin StudyboardLms
   (ios-wrapper/native/StudyboardLms.swift, android-wrapper/.../StudyboardLms.kt). The plugin only has three jobs:
     connect({id, origin, url, who})                -> a visible sign-in page on the school's own site; resolves when `who` says you are signed in
     run({id, origin, url, script, timeoutMs})       -> loads `url` in a hidden page with the same private sign-in, checks it stayed on `origin`, runs `script`
                                                       there and returns its result as JSON text
     signOut({id, origin})                           -> forgets that platform's sign-in
   Everything else, including the harvest scripts and the cleaning of what comes back, is the same code the desktop app uses (copied from lms.js at build time).
   Only loaded when the native plugin exists, and never next to the desktop app. */
(function () {
  "use strict";
  var C = window.Capacitor, plug = function () { return C && C.Plugins && C.Plugins.StudyboardLms; };
  if (!plug() || window.studiosoDesktop || window.studiosoLms) return;

/*@@FROM_LMS_JS@@*/

  var S = /*@@SCRIPTS@@*/null;
  var KEY = "studyboard:lmsOrigin:";
  var remember = function (id, origin) { try { localStorage.setItem(KEY + id, origin); } catch (e) {} };
  var recall = function (id) { try { return localStorage.getItem(KEY + id) || ""; } catch (e) { return ""; } };
  var call = async function (name, args) {
    try { var r = await plug()[name](args); return r && typeof r === "object" ? r : { error: "bad-result" }; }
    catch (e) { return { error: String((e && e.message) || e).slice(0, 200) }; }
  };
  var fill = function (tpl, safe) { return tpl.split('"@@SAFE@@"').join(JSON.stringify(safe)); };
  // Load a page on the school's site in the hidden view, run a script there, give back what it returned (or why it couldn't)
  async function runPage(id, origin, script, ms) {
    var r = await call("run", { id: id, origin: origin, url: origin + S.providers[id].ctx, script: script, timeoutMs: ms });
    if (r.error) return { error: String(r.error).slice(0, 200) };
    if (r.needLogin) return { needLogin: true };
    try { return typeof r.json === "string" ? JSON.parse(r.json) : r.json; } catch (e) { return { error: "bad-result" }; }
  }
  var busy = {};
  async function sync(id, host, opts) {
    var origin = originOf(host);
    if (!S.providers[id]) return { error: "bad-provider" };
    if (!origin) return { error: "bad-host" };
    if (busy[id]) return busy[id];
    var o = opts && typeof opts === "object" ? opts : {};
    var idOk = function (x) { return /^[\w.-]{1,40}$/.test(x); };
    var safe = { pastDays: Math.min(365, Math.max(1, Number(o.pastDays) || 60)), aheadDays: Math.min(400, Math.max(7, Number(o.aheadDays) || 240)),
      grades: o.grades !== false, news: o.news !== false,
      only: Array.isArray(o.only) ? o.only.map(String).filter(idOk).slice(0, 40) : null,
      skip: Array.isArray(o.skip) ? o.skip.map(String).filter(idOk).slice(0, 200) : [] };
    remember(id, origin);
    busy[id] = (async function () {
      try { return cleanHarvest(await runPage(id, origin, fill(S.harvest[id], safe), 150000), origin); }
      catch (e) { return { error: String((e && e.message) || e).slice(0, 200) }; }
      finally { busy[id] = null; }
    })();
    return busy[id];
  }
  async function connect(id, host) {
    var origin = originOf(host);
    if (!S.providers[id]) return { ok: false, error: "bad-provider" };
    if (!origin) return { ok: false, error: "bad-host" };
    var r = await call("connect", { id: id, origin: origin, url: origin + S.providers[id].home, who: S.who[id] });
    if (r.ok) { remember(id, origin); return { ok: true, origin: origin, name: String(r.name || "").slice(0, 200) }; }
    return r.cancelled ? { ok: false, cancelled: true } : { ok: false, error: String(r.error || "failed").slice(0, 200) };
  }
  // Canvas file: ask the API for the file's address, then fetch it from inside the signed-in page (the download starts on the school's own site)
  var FETCH_B64 = function (url) {
    return "(async () => { try { const r = await fetch(" + JSON.stringify(url) + ", {credentials: 'include'});" +
      " if (r.status === 401 || r.status === 403) return {needLogin: true}; if (!r.ok) return {error: 'HTTP ' + r.status};" +
      " if (Number(r.headers.get('content-length') || 0) > 52428800) return {error: 'too-large'};" +
      " const buf = new Uint8Array(await r.arrayBuffer()); if (buf.length > 52428800) return {error: 'too-large'};" +
      " let s = ''; for (let i = 0; i < buf.length; i += 32768) s += String.fromCharCode.apply(null, buf.subarray(i, i + 32768));" +
      " return {ok: true, name: '', type: r.headers.get('content-type') || '', b64: btoa(s)}; } catch (e) { return {error: 'download-failed'}; } })()";
  };
  async function file(id, host, spec) {
    var origin = originOf(host), s = spec && typeof spec === "object" ? spec : {};
    var num = function (x) { return /^\d{1,14}$/.test(String(x)); };
    if (!S.providers[id] || !origin) return { error: "bad-request" };
    try {
      if (id === "brightspace") {
        if (!num(s.ou) || !num(s.folder) || !num(s.id)) return { error: "bad-request" };
        return cleanFile(await runPage(id, origin, S.bsFile.split("{{ou}}").join(s.ou).split("{{folder}}").join(s.folder).split("{{id}}").join(s.id), 120000));
      }
      if (id === "canvas") {
        if (!num(s.id)) return { error: "bad-request" };
        var meta = await runPage(id, origin, S.cvFile.split("{{id}}").join(s.id), 30000);
        var bad = meta && (meta.needLogin || meta.error) ? failOf(meta) : null;
        if (!meta || bad) return bad || { error: "none" };
        if (typeof meta.url !== "string" || meta.url.length > 4000) return { error: "bad-url" };
        var u; try { u = new URL(meta.url, origin); } catch (e) { return { error: "bad-url" }; }
        if (u.origin !== origin) return { error: "bad-url" };
        var r = await runPage(id, origin, FETCH_B64(u.href), 120000);
        if (r && r.ok) { if (!r.name && typeof meta.name === "string") r.name = meta.name.slice(0, 255); if (!r.type && typeof meta.type === "string") r.type = meta.type.slice(0, 160); }
        return cleanFile(r);
      }
      return { error: "unsupported" };
    } catch (e) { return { error: String((e && e.message) || e).slice(0, 200) }; }
  }
  async function mail(id, host, spec) {
    var origin = originOf(host), q = spec && typeof spec === "object" ? spec : {};
    if (!S.providers[id] || !origin) return { error: "bad-request" };
    if (id !== "canvas") return { error: "unsupported" };
    var op = ["list", "get", "send"].indexOf(q.op) >= 0 ? q.op : null;
    if (!op) return { error: "bad-request" };
    var safe = { op: op, scope: q.scope === "sent" ? "sent" : "inbox", id: String(q.id || ""), body: typeof q.body === "string" ? q.body.trim().slice(0, 10000) : "" };
    if (op !== "list" && !/^\d{1,14}$/.test(safe.id)) return { error: "bad-request" };
    if (op === "send" && !safe.body) return { error: "empty" };
    try { var r = await runPage(id, origin, fill(S.mail, safe), 45000); return failOf(r) || plain(r, origin, 0, ""); }
    catch (e) { return { error: String((e && e.message) || e).slice(0, 200) }; }
  }
  async function signOut(id) {
    if (!S.providers[id]) return false;
    var r = await call("signOut", { id: id, origin: recall(id) });
    try { localStorage.removeItem(KEY + id); } catch (e) {}
    return !r.error;
  }
  // No `feed`: calendar links on a phone go through Studyboard's server (the page falls back to it when this call is missing)
  window.studiosoLms = { mobile: true, connect: connect, sync: sync, file: file, mail: mail, signOut: signOut };
})();
