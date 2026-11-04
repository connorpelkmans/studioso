/* ===== module: 99-onenote.js ===== */
/* OneNote: link a notebook section to a course and its pages come in as notes (kept up to date), so Ask Your Course,
   Make Flashcards and Exam Prep's topic suggestions use them like any note. Save to OneNote adds a note as a new page.
   The connection lives in the cloud-files function (provider "onenote", Notes.ReadWrite); the app gets short-lived
   access tokens from it and talks to Microsoft Graph directly. A page's link on a task is a Document link (01-doclinks).
   Class Notebooks (a teacher's notebook in a class team) are an optional second connection, "onenote_class" (Notes.Read.All and
   Team.ReadBasic.All, read only), so a school that blocks it still leaves the student's own notebooks working.
   The OneNote icon is Microsoft's own (01-ms-icons), used only on buttons that open or work with OneNote. */
/*ONENOTE-START*/
const ONENOTE = (() => {
  const TEXT_MAX = 8000, PER_RUN = 40, SEEN_MAX = 600;
  const GRAPH = "https://graph.microsoft.com/v1.0/me/onenote";
  // A short fingerprint of a note's text, to tell whether it was edited in Studyboard since it came in
  const hash = s => { let h = 0x811c9dc5; s = String(s || ""); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(36); };
  const clip = (s, n) => s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
  const iso = v => { const t = typeof v === "number" ? v : Date.parse(v); return isFinite(t) ? new Date(t).toISOString() : ""; };

  // A OneNote page (Graph's page content, parsed into a Document) -> note text. count gets {pics, files}
  const BLOCK = /^(P|DIV|H[1-6]|UL|OL|TABLE|TBODY|THEAD|BLOCKQUOTE|PRE|CITE|SECTION|ARTICLE)$/;
  function pageText(doc, title, count){
    const lines = []; let cur = "", pre = "";
    const flush = () => { const t = cur.replace(/[ \t \r\n]+/g, " ").trim(); if (t) { lines.push(pre + t); pre = ""; } cur = ""; };
    const gap = () => { flush(); if (lines.length && lines[lines.length - 1] !== "") lines.push(""); };
    const todo = el => { const t = String(el.getAttribute && el.getAttribute("data-tag") || ""); return /to-do:completed/.test(t) ? "☑ " : /to-do/.test(t) ? "☐ " : ""; };
    const depth = el => { let d = 0; for (let p = el.parentElement; p; p = p.parentElement) if (/^(UL|OL)$/.test(p.tagName)) d++; return Math.max(0, d - 1); };
    const kids = el => { for (const c of [...el.childNodes]) go(c); };
    function go(n){
      if (n.nodeType === 3) { cur += n.nodeValue; return; }
      if (n.nodeType !== 1) return;
      const tag = n.tagName.toUpperCase();
      if (/^(SCRIPT|STYLE|HEAD|TITLE|META|LINK|NOSCRIPT)$/.test(tag)) return;
      if (tag === "BR") { flush(); return; }
      if (tag === "IMG") { if (count) count.pics++; return; }
      if (tag === "OBJECT" || tag === "IFRAME") { if (count) count.files++; return; }
      if (/^H[1-6]$/.test(tag)) { gap(); kids(n); flush(); return; }
      if (tag === "LI") {
        flush();
        const list = n.parentElement, ol = list && list.tagName.toUpperCase() === "OL";
        const idx = ol ? [...list.children].filter(c => c.tagName.toUpperCase() === "LI").indexOf(n) + 1 : 0;
        pre = "  ".repeat(depth(n)) + (todo(n) || (ol ? idx + ". " : "• "));
        kids(n); flush(); pre = ""; return;
      }
      if (tag === "TR") { flush(); cur = [...n.children].map(td => String(td.textContent || "").replace(/\s+/g, " ").trim()).filter(Boolean).join(" | "); flush(); return; }
      if (BLOCK.test(tag)) { flush(); const td = todo(n); if (td && !pre) pre = td; kids(n); flush(); return; }
      kids(n);
    }
    if (doc && doc.body) go(doc.body);
    flush();
    while (lines.length && lines[0] === "") lines.shift();
    const name = String(title || "").replace(/\s+/g, " ").trim() || "Untitled page";
    if (lines[0] && lines[0].trim() === name) lines.shift();
    const body = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    return clip(name + (body ? "\n\n" + body : ""), TEXT_MAX);
  }

  // A note -> the page OneNote is given (its own HTML: a title, then paragraphs, lists and to-dos)
  const e = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
  const plainLinks = s => String(s).replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => b || a);
  function pageHtml(text, when){
    const all = plainLinks(String(text || "").replace(/\r\n?/g, "\n")).split("\n");
    while (all.length && !all[0].trim()) all.shift();
    const title = clip((all.shift() || "Studyboard note").trim(), 200);
    const out = []; let list = "";
    const close = () => { if (list) { out.push(`</${list}>`); list = ""; } };
    for (const raw of all) {
      const l = raw.replace(/\s+$/, ""), t = l.trim();
      let m;
      if (!t) { close(); continue; }
      if ((m = /^[☐☑]\s*(.*)$/.exec(t))) { close(); out.push(`<p data-tag="${t[0] === "☑" ? "to-do:completed" : "to-do"}">${e(m[1])}</p>`); continue; }
      if ((m = /^(?:[•\-*–])\s+(.*)$/.exec(t))) { if (list !== "ul") { close(); out.push("<ul>"); list = "ul"; } out.push(`<li>${e(m[1])}</li>`); continue; }
      if ((m = /^\d{1,3}[.)]\s+(.*)$/.exec(t))) { if (list !== "ol") { close(); out.push("<ol>"); list = "ol"; } out.push(`<li>${e(m[1])}</li>`); continue; }
      close();
      if ((m = /^#{1,3}\s+(.*)$/.exec(t))) out.push(`<h2>${e(m[1])}</h2>`); else out.push(`<p>${e(t)}</p>`);
    }
    close();
    const created = iso(when || Date.now());
    return `<!DOCTYPE html>\n<html><head><title>${e(title)}</title>${created ? `<meta name="created" content="${created}" />` : ""}</head><body>${out.join("")}<p style="color:#5f6368;font-size:9pt">Saved from Studyboard</p></body></html>`;
  }

  // Which pages of a linked section to bring in this time. pages: Graph's list ({id, title, lastModifiedDateTime, links});
  // notes: the notes already from this section (n.on = {p, s, u, m, h}); seen: page ids brought in before
  function plan(pages, notes, seen){
    const byPage = new Map(); (notes || []).forEach(n => { if (n && n.on && n.on.p) byPage.set(n.on.p, n); });
    const was = new Set(seen || []), out = {fetch: [], kept: 0, gone: 0, more: 0};
    const list = (pages || []).filter(p => p && typeof p.id === "string" && p.id.length <= 200).slice().sort((a, b) => String(b.lastModifiedDateTime || "").localeCompare(String(a.lastModifiedDateTime || "")));
    for (const p of list) {
      const n = byPage.get(p.id), m = iso(p.lastModifiedDateTime);
      if (!n) { if (was.has(p.id)) { out.gone++; continue; } out.fetch.push({page: p, note: null}); continue; }
      if (!m || (n.on.m && m <= n.on.m)) continue;
      if (n.on.h && hash(n.text) !== n.on.h) { out.kept++; continue; }
      out.fetch.push({page: p, note: n});
    }
    if (out.fetch.length > PER_RUN) { out.more = out.fetch.length - PER_RUN; out.fetch = out.fetch.slice(0, PER_RUN); }
    return out;
  }
  const webUrl = p => { const h = p && p.links && p.links.oneNoteWebUrl && p.links.oneNoteWebUrl.href; return typeof h === "string" && /^https:\/\//.test(h) && h.length < 2000 ? h : ""; };
  const seenNext = (seen, ids) => [...new Set([].concat(ids || [], seen || []))].slice(0, SEEN_MAX);
  // After a run: the pages seen are those that have a note (notes) or were just brought in (done), never ones only listed,
  // so pages past this run's limit (or after a stop) still come in next time instead of looking deleted
  const seenAfter = (seen, notes, done) => seenNext(seen, (notes || []).map(n => n && n.on && n.on.p).filter(Boolean).concat(done || []));
  // A note's OneNote fields, checked (sync and backups bring in anything)
  function normOn(o){
    if (!o || typeof o !== "object") return null;
    const s = (v, n) => typeof v === "string" && v.length <= n ? v : "";
    const r = {p: s(o.p, 200), s: s(o.s, 200), u: /^https:\/\//.test(s(o.u, 2000)) ? o.u : "", m: s(o.m, 40), h: s(o.h, 20)};
    return r.p ? r : null;
  }
  return {GRAPH, TEXT_MAX, PER_RUN, hash, pageText, pageHtml, plan, webUrl, seenNext, seenAfter, normOn, iso};
})();
/*ONENOTE-END*/

const SBONENOTE = (() => {
  const LS = "studyboard:onenote", NAME = "OneNote";
  const T = {transport: null, fetch: null};   // tests swap these in
  const xfetch = (u, o) => (T.fetch || fetch)(u, o);
  const ready = () => !!T.transport || (typeof sbActive === "function" && sbActive());
  async function call(body){
    if (T.transport) return T.transport(body);
    const {data, error} = await sb.functions.invoke("cloud-files", {body});
    if (!error) return {ok: true, status: 200, data};
    let status = 0, j = {}; try { status = error.context.status; j = await error.context.json(); } catch (x) {}
    return {ok: false, status, data: j || {}};
  }
  const cache = () => { try { return JSON.parse(localStorage.getItem(LS) || "null") || {}; } catch (x) { return {}; } };
  const setCache = c => { try { localStorage.setItem(LS, JSON.stringify(Object.assign(cache(), c, {at: Date.now()}))); } catch (x) {} };
  const account = () => cache().account || null;     // {account, status}
  const offered = () => !!cache().offered || !!account();
  const connected = () => { const a = account(); return !!a && a.status === "ok"; };
  // Class Notebooks: the second, optional connection
  const CLS = "onenote_class";
  const clsAccount = () => cache().cls || null;
  const clsOffered = () => !!cache().clsOffered || !!clsAccount();
  const clsConnected = () => { const a = clsAccount(); return !!a && a.status === "ok"; };
  const provOf = L => L && L.g ? CLS : "onenote";
  // Microsoft's OneNote icon (unchanged), for buttons that open or work with OneNote
  const icon = (px, cls) => typeof MS_ICON !== "undefined" ? `<img class="ms-ic${cls ? " " + cls : ""}" src="${MS_ICON.onenote[px > 20 ? "s32" : "s20"]}" alt="" width="${px}" height="${px}" draggable="false">` : "";

  /* Settings: the linked sections and where Save to OneNote goes (synced with the account) */
  const str = (v, n) => typeof v === "string" ? v.replace(/[<>\u0000-\u001f]/g, " ").slice(0, n) : "";
  function prefs(){
    const o = (state.settings && state.settings.onenote) || {};
    const links = (Array.isArray(o.links) ? o.links : []).filter(l => l && typeof l.sid === "string" && l.sid && l.sid.length <= 200).slice(0, 12).map(l => ({
      sid: l.sid, g: typeof l.g === "string" && /^[\w-]{1,80}$/.test(l.g) ? l.g : "", name: str(l.name, 80) || "Section", nb: str(l.nb, 120), courseId: str(l.courseId, 80), board: str(l.board, 80), at: Number(l.at) || 0,
      seen: Array.isArray(l.seen) ? l.seen.filter(x => typeof x === "string" && x.length <= 200).slice(0, 600) : [], n: Number(l.n) || 0, more: Number(l.more) || 0}));
    const st = o.saveTo && typeof o.saveTo.sid === "string" && o.saveTo.sid ? {sid: o.saveTo.sid.slice(0, 200), name: str(o.saveTo.name, 80), nb: str(o.saveTo.nb, 80)} : null;
    return {links, saveTo: st};
  }
  const setPrefs = patch => { state.settings = Object.assign({}, state.settings, {onenote: Object.assign(prefs(), patch)}); saveSettings(); };

  /* Microsoft Graph with a short-lived token */
  class OnErr extends Error { constructor(msg, code){ super(msg); this.code = code || ""; } }
  const TOK = {};
  async function token(fresh, prov){
    prov = prov || "onenote";
    const t = TOK[prov]; if (t && !fresh && t.exp - Date.now() > 60000) return t.access;
    if (!ready()) throw new OnErr("Sign in to your Studyboard account first.", "signin");
    const r = await call({action: "token", provider: prov});
    if (r.ok && r.data && r.data.access) { TOK[prov] = {access: r.data.access, exp: Date.now() + Math.max(120, Number(r.data.expires_in) || 3000) * 1000}; return r.data.access; }
    delete TOK[prov];
    const key = prov === CLS ? "cls" : "account", what = prov === CLS ? "Class Notebooks" : "OneNote";
    if (r.status === 404) { setCache({[key]: null}); throw new OnErr(prov === CLS ? "Turn on Class Notebooks first (in the OneNote sheet)." : "Connect OneNote first.", "connect"); }
    if (r.status === 409) { setCache({[key]: Object.assign({}, cache()[key], {status: "reauth"})}); throw new OnErr(`${what} needs you to connect it again.`, "reauth"); }
    if (r.status === 429) throw new OnErr("OneNote is busy. Try again in a few minutes.", "busy");
    throw new OnErr("Couldn't reach OneNote. Check your connection.", "net");
  }
  async function graph(path, init, as, prov){
    init = init || {};
    for (let i = 0; i < 2; i++) {
      const at = await token(i > 0, prov);
      let r;
      try { r = await xfetch(/^https:/.test(path) ? path : ONENOTE.GRAPH + path, Object.assign({}, init, {headers: Object.assign({Authorization: "Bearer " + at}, init.headers || {})})); }
      catch (x) { throw new OnErr("Couldn't reach OneNote. Check your connection.", "net"); }
      if (r.status === 401 && i === 0) continue;
      if (r.status === 429) throw new OnErr("OneNote asked Studyboard to slow down. The rest comes in next time.", "busy");
      if (r.status === 404) throw new OnErr("That isn't in your OneNote any more.", "gone");
      if (r.status === 403) throw new OnErr(prov === CLS ? "Your school didn't allow Studyboard to read that class notebook." : "OneNote didn't allow that. A school account's notebooks may be read only.", "denied");
      if (!r.ok) throw new OnErr(`OneNote didn't accept that (${r.status}).`, "http");
      return as === "text" ? r.text() : r.json().catch(() => ({}));
    }
  }
  // Every section, with its notebook (sections inside section groups too)
  const V1 = "https://graph.microsoft.com/v1.0";
  const next = j => typeof j["@odata.nextLink"] === "string" && j["@odata.nextLink"].startsWith(V1 + "/") ? j["@odata.nextLink"] : "";
  // Where a section's pages live: your own OneNote, or a class team's
  const rootOf = g => g ? `${V1}/groups/${encodeURIComponent(g)}/onenote` : ONENOTE.GRAPH;
  const sortSecs = list => list.sort((a, b) => (a.nb + "\u0000" + a.name).localeCompare(b.nb + "\u0000" + b.name));
  // Your own notebooks' sections (sections inside section groups too)
  async function ownSections(){
    const out = []; let url = "/sections?$select=id,displayName&$expand=parentNotebook($select=id,displayName)&$top=100";
    for (let i = 0; url && i < 5; i++) {
      const j = await graph(url);
      (j.value || []).forEach(s => { if (s && s.id) out.push({sid: s.id, g: "", name: str(s.displayName, 80) || "Section", nb: str(s.parentNotebook && s.parentNotebook.displayName, 80)}); });
      url = next(j);
    }
    return sortSecs(out);
  }
  // Class Notebooks: the notebooks in each class team you're in (read only)
  async function classSections(){
    const teams = [], out = []; let url = `${V1}/me/joinedTeams?$select=id,displayName`;
    for (let i = 0; url && i < 3; i++) { const j = await graph(url, null, "", CLS); (j.value || []).forEach(t => { if (t && typeof t.id === "string" && /^[\w-]{1,80}$/.test(t.id)) teams.push({id: t.id, name: str(t.displayName, 60) || "Class"}); }); url = next(j); }
    for (const t of teams.slice(0, 30)) {
      let u2 = `${rootOf(t.id)}/sections?$select=id,displayName&$expand=parentNotebook($select=id,displayName)&$top=100`;
      try {
        for (let i = 0; u2 && i < 3; i++) {
          const j = await graph(u2, null, "", CLS);
          (j.value || []).forEach(s => { if (s && s.id) out.push({sid: s.id, g: t.id, name: str(s.displayName, 80) || "Section", nb: t.name + " › " + (str(s.parentNotebook && s.parentNotebook.displayName, 60) || "Class Notebook"), cls: true}); });
          u2 = next(j);
        }
      } catch (x) { if (x.code === "busy" || x.code === "net" || x.code === "reauth" || x.code === "signin") throw x; }   // a team with no notebook, or one you can't open: skipped
    }
    return sortSecs(out);
  }
  // What Link a Section offers: yours, then your classes' (when Class Notebooks are on)
  async function sections(){
    const own = await ownSections();
    if (!clsConnected()) return own;
    try { return own.concat(await classSections()); }
    catch (x) { U.clsErr = x instanceof OnErr ? x.message : "Couldn't load your Class Notebooks."; return own; }
  }
  async function pagesOf(sid, g){
    const out = []; let url = `${rootOf(g)}/sections/${encodeURIComponent(sid)}/pages?$select=id,title,lastModifiedDateTime,createdDateTime,links&$top=100&$orderby=lastModifiedDateTime desc`;
    for (let i = 0; url && i < 4; i++) {
      const j = await graph(url, null, "", g ? CLS : "onenote");
      (j.value || []).forEach(p => { if (p && p.id) out.push(p); });
      url = next(j);
    }
    return out;
  }

  /* Bringing a section in */
  const fromSection = sid => notesArr().filter(n => n && n.on && n.on.s === sid);
  const NOTE_W0 = () => (typeof NOTE_W === "function" ? NOTE_W() : 200);
  // A board for the section, tied to its course (made the first time)
  function boardFor(L){
    const have = noteBoards();
    if (L.board && have.some(b => b.id === L.board)) return L.board;
    const nb = {id: uid(), name: str(L.name, 40) || "OneNote", courseId: L.courseId || ""};
    state.settings = Object.assign({}, state.settings, {noteBoards: have.concat(nb)}); saveSettings();
    return nb.id;
  }
  const running = new Set();
  async function syncLink(sid, opts){
    opts = opts || {};
    if (running.has(sid)) return null;
    const L0 = prefs().links.find(l => l.sid === sid); if (!L0) return null;
    running.add(sid); paint();
    try {
      const board = boardFor(L0);
      const pages = await pagesOf(sid, L0.g);
      const mine = fromSection(sid), P = ONENOTE.plan(pages, mine, L0.seen), base = new Map(mine.map(n => [n.id, String(n.text || "")]));
      const changes = [], live = notesArr().filter(n => !n.archived && (n.board || "") === board);
      let z = notesArr().reduce((m, n) => Math.max(m, n.z || 0), 0), top = live.reduce((m, n) => Math.max(m, (n.y || 0) + 280), 40), k = 0, failed = 0, stop = "", done = [];
      for (const {page, note} of P.fetch) {
        let html;
        try { html = await graph(`${rootOf(L0.g)}/pages/${encodeURIComponent(page.id)}/content`, null, "text", provOf(L0)); }
        catch (x) { if (x.code === "busy" || x.code === "net" || x.code === "reauth" || x.code === "signin") { stop = x.message; break; } failed++; continue; }
        const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
        const text = ONENOTE.pageText(doc, page.title, {pics: 0, files: 0});
        const on = {p: page.id, s: sid, u: ONENOTE.webUrl(page), m: ONENOTE.iso(page.lastModifiedDateTime), h: ONENOTE.hash(text)};
        done.push(page.id);
        if (note) changes.push({kind: "note", id: note.id, after: Object.assign(clone(note), {text, on})});
        else {
          const n = normNote({id: uid(), text, color: "purple", x: 40 + (k % 4) * (NOTE_W0() + 24), y: top + Math.floor(k / 4) * 300, z: ++z, rot: 0, courseId: L0.courseId || "", board, created: Date.parse(page.createdDateTime) || Date.now(), on});
          changes.push({kind: "note", id: n.id, after: n}); k++;
        }
        await new Promise(r => setTimeout(r, opts.gap == null ? 150 : opts.gap));
      }
      // A note edited (or deleted) here while the pages were coming in keeps the edit: re-read it now
      let kept = P.kept;
      for (let i = changes.length - 1; i >= 0; i--) {
        const c = changes[i]; if (!base.has(c.id)) continue;
        const cur = state.notes[c.id];
        if (!cur || String(cur.text || "") !== base.get(c.id)) { changes.splice(i, 1); if (cur) kept++; continue; }
        c.after = Object.assign(clone(cur), {text: c.after.text, on: c.after.on});
      }
      const added = changes.filter(c => !state.notes[c.id]).length, updated = changes.length - added;
      if (changes.length) applyChanges(changes, `OneNote: ${[added ? `${added} page${added === 1 ? "" : "s"} brought in` : "", updated ? `${updated} updated` : ""].filter(Boolean).join(", ")} from ${L0.name}`);
      const more = P.more + (stop ? P.fetch.length - done.length : 0);
      setPrefs({links: prefs().links.map(l => l.sid === sid ? Object.assign({}, l, {board, at: Date.now(), seen: ONENOTE.seenAfter(l.seen, mine, done), n: fromSection(sid).length, more}) : l)});
      const msg = stop || (failed ? `${failed} page${failed === 1 ? "" : "s"} couldn't be read. ` : "") + (kept ? `${kept} note${kept === 1 ? "" : "s"} you edited here kept your changes. ` : "") + (more ? "The rest come in on the next update." : "");
      if (!changes.length && opts.say) toast(msg.trim() || `${L0.name} is up to date`);
      else if (msg.trim() && opts.say) setTimeout(() => toast(msg.trim()), 2800);
      return {added, updated, kept, more, failed};
    } catch (x) {
      if (opts.say) toast(x instanceof OnErr ? x.message : "Couldn't update from OneNote.", null, null, {error: true});
      return null;
    } finally { running.delete(sid); paint(); }
  }
  async function syncAll(opts){
    for (const L of prefs().links) if ((L.g ? clsConnected() : connected()) && (opts && opts.force || Date.now() - L.at > 3 * 3600e3)) await syncLink(L.sid, opts);
  }

  /* Save to OneNote */
  const saving = new Set();
  async function save(id, sec){
    const n = state.notes[id]; if (!n || !String(n.text || "").trim()) { toast("Write something in the note first"); return; }
    if (!connected()) { open({why: "Connect OneNote to save notes there."}); return; }
    const to = sec || prefs().saveTo;
    if (!to) { open({pickFor: id}); return; }
    if (saving.has(id)) return; saving.add(id);
    toast("Saving to OneNote…");
    try {
      const r = await graph(`/sections/${encodeURIComponent(to.sid)}/pages`, {method: "POST", headers: {"Content-Type": "text/html"}, body: ONENOTE.pageHtml(n.text, Date.now())});
      const u = ONENOTE.webUrl(r), cur = state.notes[id];
      if (cur) applyChanges([{kind: "note", id, after: Object.assign(clone(cur), {onSaved: {p: String(r.id || "").slice(0, 200), u, s: to.sid, at: Date.now()}})}], null);
      toast(`Saved to OneNote in ${to.name}`, null, u ? {label: "Open", fn: () => openOutside(u)} : null);
      paintNote();
    } catch (x) {
      if (x.code === "gone" && prefs().saveTo && prefs().saveTo.sid === to.sid) setPrefs({saveTo: null});
      toast(x instanceof OnErr ? (x.code === "gone" ? "That OneNote section is gone. Pick another one." : x.message) : "Couldn't save to OneNote.", null, null, {error: true});
    } finally { saving.delete(id); }
  }
  // The button for a note (note editor, Ask Your Course, a lecture's study notes)
  function saveBtn(id, cls){
    const n = state.notes[id]; if (!n || !offered()) return "";
    const on = ONENOTE.normOn(n.on);
    if (on && on.u) return `<button type="button" class="btn on-btn ${cls || "small"}" data-act="dl-url" data-url="${esc(on.u)}">${icon(16)}Open in OneNote</button>`;
    if (on) return "";
    const sv = n.onSaved && typeof n.onSaved.u === "string" && /^https:\/\//.test(n.onSaved.u) ? n.onSaved.u : "";
    return sv ? `<button type="button" class="btn on-btn ${cls || "small"}" data-act="dl-url" data-url="${esc(sv)}">${icon(16)}Open in OneNote</button><button type="button" class="link-btn" data-act="on-save" data-id="${esc(id)}">Save Again</button>`
      : `<button type="button" class="btn on-btn ${cls || "small"}" data-act="on-save" data-id="${esc(id)}">${icon(16)}Save to OneNote</button>`;
  }
  // The small button in the note editor's toolbar
  function noteBtn(n){
    if (!n || !offered()) return "";
    const on = ONENOTE.normOn(n.on);
    if (on) return on.u ? `<button type="button" class="nb on-nb" data-act="dl-url" data-url="${esc(on.u)}" title="Open in OneNote" aria-label="Open in OneNote">${icon(18) || "N"}</button>` : "";
    return `<button type="button" class="nb on-nb" data-act="on-save" data-id="${esc(n.id)}" title="Save to OneNote" aria-label="Save to OneNote">${icon(18) || "N"}</button>`;
  }
  const paintNote = () => { if (typeof scheduleRender === "function") scheduleRender(); };

  /* The OneNote sheet */
  const U = {loading: false, err: "", url: "", urlAt: 0, clsUrl: "", clsUrlAt: 0, clsErr: "", clsConfirm: false, secs: null, secErr: "", pickFor: "", why: "", adding: false, confirm: false, wait: 0};
  const ago = t => { if (!t) return "not yet"; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : Math.round(m / 1440) + " d ago"; };
  const courseOpts = sel => `<option value="">No course</option>` + coursesArr().map(c => `<option value="${esc(c.id)}"${c.id === sel ? " selected" : ""}>${esc(courseLabel(c))}</option>`).join("");
  const guessCourse = s => { const w = String(s.name + " " + s.nb).toLowerCase(); const c = coursesArr().find(c => [c.code, c.name].some(x => x && String(x).length >= 3 && w.includes(String(x).toLowerCase()))); return c ? c.id : ""; };
  function bodyHtml(){
    if (!ready()) return `<p>OneNote connects to your Studyboard account. Sign in first, then come back here.</p><div class="row-actions"><button type="button" class="btn small primary" data-act="sb-signin">Sign In</button></div>`;
    if (U.loading && !cache().at) return `<p class="mini"><span class="ai-spin" aria-hidden="true"></span> Checking OneNote…</p>`;
    if (U.err) return `<p class="cl-warn">${esc(U.err)}</p>`;
    const a = account(), pr = prefs();
    const link = label => U.url ? `<a class="btn small primary on-btn" href="${esc(U.url)}" target="_blank" rel="noopener noreferrer" data-on-go="1">${icon(16)}${esc(label)}</a>` : `<button type="button" class="btn small" disabled>Getting OneNote ready…</button>`;
    if (!a || a.status !== "ok") {
      return `${U.why ? `<p class="on-why"><b>${esc(U.why)}</b></p>` : ""}
        <p>Link a OneNote section to a course and its pages come into Studyboard as notes, kept up to date. Ask Your Course, Make Flashcards and Exam Prep use them like your other notes. Save to OneNote adds a note, a lecture's study notes or an Ask Your Course answer as a new page.</p>
        <p class="mini">Studyboard reads only the sections you link, and never changes or deletes your pages.</p>
        <p class="mini ms-school"><b>${esc(MS_SCHOOL_SOON)}</b></p>
        ${a && a.status === "reauth" ? `<p class="cl-warn">OneNote stopped accepting Studyboard's access. Connect again to keep using it.</p>` : ""}
        <div class="row-actions">${link(a ? "Connect Again" : "Connect OneNote")}</div>
        ${U.wait ? `<p class="mini" role="status">Finish in the tab that opened. This updates when you come back. If Microsoft asked for admin approval, you signed in with a school or work account, which can't connect yet.</p>` : ""}`;
    }
    const rows = pr.links.map(l => {
      const c = l.courseId && courseOf(l.courseId), busy = running.has(l.sid);
      return `<li class="on-link"><span class="on-l-main">${icon(20)}<span><b>${esc(l.name)}</b><span class="mini">${esc([l.nb, c ? courseLabel(c) : "No course"].filter(Boolean).join(" · "))}</span>
        <span class="mini">${busy ? `<span class="ai-spin" aria-hidden="true"></span> Updating…` : `${l.n} page${l.n === 1 ? "" : "s"} · updated ${esc(ago(l.at))}${l.more ? " · more to come" : ""}`}</span></span></span>
        <span class="on-l-acts"><button type="button" class="btn small" data-act="on-sync" data-id="${esc(l.sid)}"${busy ? " disabled" : ""}>Update Now</button><button type="button" class="link-btn" data-act="on-open-board" data-id="${esc(l.sid)}">Open Notes</button><button type="button" class="link-btn" data-act="on-unlink" data-id="${esc(l.sid)}">Unlink</button></span></li>`;
    }).join("");
    const opt = (s, i) => `<option value="${i}">${esc((s.nb ? s.nb + " › " : "") + s.name)}${pr.links.some(l => l.sid === s.sid) ? " (linked)" : ""}</option>`;
    const forSaveOnly = !!U.pickFor, list = (U.secs || []).map((s, i) => [s, i]).filter(([s]) => !forSaveOnly || !s.g);
    const own = list.filter(([s]) => !s.g), cls = list.filter(([s]) => s.g);
    const pick = U.secs ? (list.length ? `<label class="f">Section<select id="onSec">${cls.length ? `<optgroup label="My Notebooks">${own.map(([s, i]) => opt(s, i)).join("")}</optgroup><optgroup label="Class Notebooks (read only)">${cls.map(([s, i]) => opt(s, i)).join("")}</optgroup>` : own.map(([s, i]) => opt(s, i)).join("")}</select></label>
      ${U.clsErr && !forSaveOnly ? `<p class="cl-warn">${esc(U.clsErr)}</p>` : ""}` : `<p class="mini">No sections found in your OneNote yet.</p>`)
      : U.secErr ? `<p class="cl-warn">${esc(U.secErr)}</p>` : `<p class="mini"><span class="ai-spin" aria-hidden="true"></span> Loading your notebooks…</p>`;
    const firstSec = list.length ? list[0][0] : null;
    const adding = U.adding ? `<div class="on-add">${pick}${list.length ? `<label class="f">Course<select id="onCourse">${courseOpts(guessCourse(firstSec))}</select></label>
      <div class="row-actions"><button type="button" class="btn small" data-act="on-add-cancel">Cancel</button><button type="button" class="btn small primary" data-act="on-link">Link and Bring In</button></div>` : ""}</div>` : "";
    const forSave = U.pickFor ? `<div class="on-add"><p><b>Where should Save to OneNote put pages?</b></p>${pick}${list.length ? `<div class="row-actions"><button type="button" class="btn small" data-act="on-add-cancel">Cancel</button><button type="button" class="btn small primary" data-act="on-save-here">Save Here</button></div>` : ""}</div>` : "";
    return `<p class="mini">Connected as <b>${esc(a.account || "your Microsoft account")}</b></p>
      ${forSave}
      <h3 class="on-h">Linked Sections</h3>
      ${rows ? `<ul class="on-links">${rows}</ul>` : `<p class="mini">Link a section and its pages come in as notes on their own board, tied to the course. Ask Your Course, Make Flashcards and Exam Prep use them from then on.</p>`}
      ${adding || (pr.links.length < 12 ? `<div class="row-actions"><button type="button" class="btn small primary" data-act="on-add">Link a Section</button></div>` : "")}
      ${clsHtml()}
      <h3 class="on-h">Save to OneNote</h3>
      <p class="mini">${pr.saveTo ? `New pages go to <b>${esc((pr.saveTo.nb ? pr.saveTo.nb + " › " : "") + pr.saveTo.name)}</b>.` : "Pick a section the first time you save."} Use Save to OneNote on a note, a lecture's study notes or an Ask Your Course answer.</p>
      ${pr.saveTo ? `<div class="row-actions"><button type="button" class="link-btn" data-act="on-save-change">Change Section</button></div>` : ""}
      <div class="on-off">${U.confirm ? `<span class="mini">Disconnect? Notes already brought in stay in Studyboard.</span><button type="button" class="btn small danger" data-act="on-off">Disconnect</button><button type="button" class="btn small" data-act="on-off-no">Keep</button>` : `<button type="button" class="link-btn" data-act="on-off-ask">Disconnect OneNote</button>`}</div>`;
  }
  // Class Notebooks: off, waiting, on, or needing a new connection
  function clsHtml(){
    if (!clsOffered()) return "";
    const a = clsAccount(), on = clsConnected();
    const go = label => U.clsUrl ? `<a class="btn small on-btn" href="${esc(U.clsUrl)}" target="_blank" rel="noopener noreferrer" data-on-go="cls">${icon(16)}${esc(label)}</a>` : `<button type="button" class="btn small" disabled>Getting Class Notebooks ready…</button>`;
    // Class Notebooks live in school accounts, which can't connect yet
    if (!on && msPersonal((account() || {}).account)) return `<h3 class="on-h">Class Notebooks</h3><p class="mini">Teachers' Class Notebooks need a school Microsoft account. School accounts can't connect yet. That's coming in the future.</p>`;
    if (!on) return `<h3 class="on-h">Class Notebooks</h3>
      <p class="mini">See your teachers' OneNote Class Notebooks from Microsoft Teams too, and link their sections like your own (read only). This asks Microsoft for one more permission. Your own notebooks keep working either way.</p>
      ${a && a.status === "reauth" ? `<p class="cl-warn">Class Notebooks stopped working. Connect again to keep them.</p>` : ""}
      <div class="row-actions">${go(a ? "Connect Class Notebooks Again" : "Add Class Notebooks")}</div>`;
    return `<h3 class="on-h">Class Notebooks</h3><p class="mini">On. Sections from your class teams show under Class Notebooks in Link a Section.</p>
      <div class="on-off">${U.clsConfirm ? `<span class="mini">Turn off? Class sections already linked stop updating; their notes stay.</span><button type="button" class="btn small danger" data-act="on-cls-off">Turn Off</button><button type="button" class="btn small" data-act="on-cls-no">Keep</button>` : `<button type="button" class="link-btn" data-act="on-cls-ask">Turn Off Class Notebooks</button>`}</div>`;
  }
  function paint(){ const el = document.getElementById("onBody"); if (el && dlg.open) el.innerHTML = bodyHtml(); }
  async function loadStatus(){
    if (!ready()) return;
    U.loading = true; paint();
    const r = await call({action: "status"});
    U.loading = false;
    if (r.ok) {
      const accts = (r.data && r.data.accounts) || [], provs = (r.data && r.data.providers) || {};
      const a = accts.find(x => x.provider === "onenote") || null, p = !!provs.onenote, ca = accts.find(x => x.provider === CLS) || null;
      setCache({account: a ? {account: a.account || "", status: a.status || "ok"} : null, offered: p, cls: ca ? {account: ca.account || "", status: ca.status || "ok"} : null, clsOffered: !!provs[CLS]});
      U.err = p || a ? "" : "OneNote isn't set up on this Studyboard server yet.";
      if (p && (!a || a.status !== "ok") && (!U.url || Date.now() - U.urlAt > 10 * 60000)) {
        const s = await call({action: "start", provider: "onenote"});
        U.url = s.ok && s.data && /^https:\/\//.test(s.data.url) ? s.data.url : ""; U.urlAt = Date.now();
        if (!s.ok) U.err = s.status === 501 ? "OneNote isn't set up on this Studyboard server yet." : "Couldn't reach Studyboard's server. Try again in a moment.";
      }
      if (connected() && clsOffered() && !clsConnected() && (!U.clsUrl || Date.now() - U.clsUrlAt > 10 * 60000)) {
        const s = await call({action: "start", provider: CLS});
        U.clsUrl = s.ok && s.data && /^https:\/\//.test(s.data.url) ? s.data.url : ""; U.clsUrlAt = Date.now();
      }
    } else U.err = r.status === 404 || r.status === 0 ? "OneNote isn't set up on this Studyboard server yet." : "Couldn't check OneNote. Try again in a moment.";
    paint();
    if (connected() && (U.adding || U.pickFor) && !U.secs) loadSections();
  }
  async function loadSections(){
    U.secs = null; U.secErr = ""; U.clsErr = ""; paint();
    try { U.secs = await sections(); } catch (x) { U.secErr = x instanceof OnErr ? x.message : "Couldn't load your notebooks."; }
    paint();
  }
  function open(opts){
    opts = opts || {};
    U.pickFor = opts.pickFor || ""; U.why = opts.why || ""; U.adding = false; U.confirm = false; U.clsConfirm = false; U.err = ""; U.secs = null;
    openSheet(`<div class="sheet on-sheet">${head(NAME)}<div class="sheet-body" id="onBody">${bodyHtml()}</div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Done</button></div></div>`);
    loadStatus();
  }
  // After Connect, the new tab finishes; the sheet notices when you come back
  let poll = 0;
  let waitFor = "onenote";
  const arrived = () => loadStatus().then(() => {
    if (!(waitFor === CLS ? clsConnected() : connected())) return;
    U.wait = 0; clearInterval(poll); delete TOK[waitFor];
    if (waitFor === CLS) { U.secs = null; toast("Class Notebooks are on. Link a Section lists them now."); } else toast("OneNote is connected");
    paint();
  });
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("[data-on-go]"); if (!a) return;
    waitFor = a.dataset.onGo === "cls" ? CLS : "onenote";
    U.wait = Date.now(); setTimeout(paint, 50);
    clearInterval(poll); poll = setInterval(() => { if (!U.wait || Date.now() - U.wait > 4 * 60000) { clearInterval(poll); U.wait = 0; paint(); return; } if (!document.hidden) arrived(); }, 6000);
  });
  window.addEventListener("focus", () => { if (U.wait && Date.now() - U.wait < 5 * 60000) arrived(); });
  window.addEventListener("sb:secrets-wiped", () => { try { localStorage.removeItem(LS); } catch (x) {} Object.keys(TOK).forEach(k => delete TOK[k]); });

  hook("act", (act, el, id) => {
    switch (act) {
      case "on-open": open(); return true;
      case "on-add": U.adding = true; U.pickFor = ""; if (U.secs) paint(); else loadSections(); return true;
      case "on-add-cancel": U.adding = false; U.pickFor = ""; paint(); return true;
      case "on-link": {
        const s = U.secs && U.secs[Number(($("#onSec") || {}).value)]; if (!s) return true;
        const courseId = ($("#onCourse") || {}).value || "", pr = prefs();
        const links = pr.links.filter(l => l.sid !== s.sid).concat({sid: s.sid, g: s.g || "", name: s.name, nb: s.nb, courseId, board: "", at: 0, seen: [], n: 0, more: 0});
        setPrefs({links}); U.adding = false; paint();
        syncLink(s.sid, {say: true});
        return true;
      }
      case "on-sync": syncLink(id, {say: true}); return true;
      case "on-open-board": { const l = prefs().links.find(x => x.sid === id); if (!l || !l.board) { toast("Nothing has come in yet"); return true; } if (dlg.open) dlg.close(); ui.tab = "notes"; ui.noteBoard = l.board; render(); window.scrollTo(0, 0); return true; }
      case "on-unlink": { const l = prefs().links.find(x => x.sid === id); setPrefs({links: prefs().links.filter(x => x.sid !== id)}); toast(`Unlinked ${l ? l.name : "the section"}. Its notes stay in Studyboard.`); paint(); return true; }
      case "on-save": save(id); return true;
      case "on-save-change": U.pickFor = "*"; if (U.secs) paint(); else loadSections(); return true;
      case "on-save-here": {
        const s = U.secs && U.secs[Number(($("#onSec") || {}).value)]; if (!s || s.g) return true;
        setPrefs({saveTo: {sid: s.sid, name: s.name, nb: s.nb}});
        const nid = U.pickFor; U.pickFor = ""; paint();
        if (nid && nid !== "*") { if (dlg.open) dlg.close(); save(nid, s); }
        return true;
      }
      case "on-off-ask": U.confirm = true; paint(); return true;
      case "on-off-no": U.confirm = false; paint(); return true;
      case "on-off": (async () => { await call({action: "disconnect", provider: "onenote"}); await call({action: "disconnect", provider: CLS}); Object.keys(TOK).forEach(k => delete TOK[k]); setCache({account: null, cls: null}); U.confirm = false; U.url = ""; U.clsUrl = ""; U.secs = null; toast("OneNote is disconnected. Notes already brought in stay."); loadStatus(); })(); return true;
      case "on-cls-ask": U.clsConfirm = true; paint(); return true;
      case "on-cls-no": U.clsConfirm = false; paint(); return true;
      case "on-cls-off": (async () => { await call({action: "disconnect", provider: CLS}); delete TOK[CLS]; setCache({cls: null}); U.clsConfirm = false; U.clsUrl = ""; U.secs = null; toast("Class Notebooks are off. Notes already brought in stay."); loadStatus(); })(); return true;
    }
    return false;
  });

  // Linked sections stay up to date: a while after start, then every half hour while Studyboard is open (each section at most every 3 hours)
  setTimeout(() => { if (ready() && prefs().links.length) loadStatus().then(() => syncAll()); }, 20000);
  setInterval(() => { if (!document.hidden && ready() && prefs().links.length) syncAll(); }, 30 * 60000);

  const css = document.createElement("style");
  css.textContent = `
.on-sheet .on-h{font-size:.95rem;margin:16px 0 6px}
.on-links{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;border-top:1px solid var(--line)}
.on-link{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;padding:10px 2px;border-bottom:1px solid var(--line)}
.on-l-main{display:flex;gap:10px;align-items:flex-start;flex:1 1 220px;min-width:0}
.on-l-main>span:last-child{display:flex;flex-direction:column;min-width:0}
.on-l-main b{overflow-wrap:anywhere}
.on-l-acts{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center}
.on-add{margin:10px 0;padding:12px;border:1px solid var(--line);border-radius:12px}
.on-add select{max-width:100%}
.on-off{margin-top:18px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.ms-ic{flex:none;display:inline-block;vertical-align:middle}
.on-btn{display:inline-flex;align-items:center;gap:6px}
.on-nb .ms-ic{display:block}
.on-l-main>.ms-ic{margin-top:2px}
`;
  document.head.appendChild(css);
  return {open, save, saveBtn, noteBtn, syncLink, syncAll, prefs, connected, offered, clsConnected, sections, icon, T, setCache, cache};
})();
window.SBONENOTE = SBONENOTE;
