/* ===== module: 01-doclinks.js ===== */
/* Document links on a task: a Google Doc, a Word file, a OneNote page or a Canva design, one tap from the deadline.
   Links only: nothing is fetched or signed in to, and the page opens in the browser (or the computer's own browser). */
/*DOCLINKS-START*/
const DOCLINK = (() => {
  const MAX = 12, NAME_MAX = 120, URL_MAX = 2000;
  // app -> [label, short badge letter, family]
  const APPS = {
    gdoc: ["Google Doc", "D", "google"], gsheet: ["Google Sheet", "S", "google"], gslides: ["Google Slides", "P", "google"],
    gform: ["Google Form", "F", "google"], gdrive: ["Google Drive File", "G", "google"],
    word: ["Word Document", "W", "microsoft"], excel: ["Excel Workbook", "X", "microsoft"], ppt: ["PowerPoint", "P", "microsoft"],
    onenote: ["OneNote Page", "N", "microsoft"], m365: ["Microsoft 365 File", "M", "microsoft"],
    canva: ["Canva Design", "C", "canva"], web: ["Web Page", "", "web"]
  };
  const EXT = {doc: "word", docx: "word", dotx: "word", rtf: "word", xls: "excel", xlsx: "excel", xlsm: "excel", csv: "excel", ppt: "ppt", pptx: "ppt", potx: "ppt", one: "onenote", onetoc2: "onenote"};
  const MS_LETTER = {w: "word", x: "excel", p: "ppt", o: "onenote"};
  const MS_HOST = /(^|\.)(sharepoint\.com|onedrive\.live\.com|1drv\.ms|office\.com|office\.live\.com|officeapps\.live\.com|onenote\.com|onenote\.officeapps\.live\.com|microsoft365\.com|cloud\.microsoft)$/i;

  // A pasted link -> a clean https address, or "" (OneNote's desktop "onenote:https://..." form and a pasted pair of links work too)
  function clean(raw){
    let s = String(raw || "").trim();
    const all = s.match(/https?:\/\/[^\s<>"']+/gi);
    if (all) s = all[0]; else if (/^onenote:/i.test(s)) return "";
    s = s.replace(/^onenote:/i, "");
    if (!/^https?:\/\//i.test(s)) { if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(s)) s = "https://" + s; else return ""; }
    try {
      const u = new URL(s);
      if (u.protocol !== "https:" && u.protocol !== "http:") return "";
      if (!u.hostname || u.username || u.password) return "";
      const out = u.href;
      return out.length <= URL_MAX ? out : "";
    } catch (e) { return ""; }
  }
  const extOf = s => { const m = /\.([a-z0-9]{1,8})$/i.exec(String(s || "")); return m ? m[1].toLowerCase() : ""; };
  const dec = s => { try { return decodeURIComponent(String(s || "").replace(/\+/g, " ")); } catch (e) { return String(s || ""); } };
  // Which app a link belongs to
  function appOf(url){
    let u; try { u = new URL(url); } catch (e) { return "web"; }
    const h = u.hostname.toLowerCase(), p = u.pathname;
    if (h === "docs.google.com") {
      if (/^\/document\//.test(p)) return "gdoc";
      if (/^\/spreadsheets\//.test(p)) return "gsheet";
      if (/^\/presentation\//.test(p)) return "gslides";
      if (/^\/forms\//.test(p)) return "gform";
      return "gdrive";
    }
    if (h === "forms.gle") return "gform";
    if (h === "drive.google.com") return "gdrive";
    if (h === "canva.com" || h.endsWith(".canva.com") || h === "canva.link") return "canva";
    if (MS_HOST.test(h)) {
      if (/onenote/i.test(h) || /\/onenote\b|onenote\.aspx/i.test(p)) return "onenote";
      const letter = /^\/:([wxpo]):\//i.exec(p) || (h === "1drv.ms" ? /^\/([wxpo])\//i.exec(p) : null);
      if (letter) return MS_LETTER[letter[1].toLowerCase()];
      const app = (u.searchParams.get("app") || "").toLowerCase();
      if (/^word$/.test(app)) return "word"; if (/^excel$/.test(app)) return "excel"; if (/^powerpoint$/.test(app)) return "ppt"; if (/^onenote$/.test(app)) return "onenote";
      const e = extOf(nameIn(u)) || extOf(dec(p));
      if (EXT[e]) return EXT[e];
      if (/^\/(word|excel|powerpoint)\b/i.test(p)) return {word: "word", excel: "excel", powerpoint: "ppt"}[p.split("/")[1].toLowerCase()];
      return "m365";
    }
    return "web";
  }
  // A file name the link carries (SharePoint's file= or a path ending in .docx), without its extension
  function nameIn(u){
    for (const k of ["file", "filename", "title"]) { const v = u.searchParams.get(k); if (v && extOf(v)) return dec(v); }
    const last = dec(u.pathname.split("/").filter(Boolean).pop() || "");
    return EXT[extOf(last)] ? last : "";
  }
  function nameOf(url){
    let u; try { u = new URL(url); } catch (e) { return ""; }
    const n = nameIn(u).replace(/\.[a-z0-9]{1,8}$/i, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
    return n.slice(0, NAME_MAX);
  }
  const label = app => (APPS[app] || APPS.web)[0];
  const host = url => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return ""; } };
  const shown = d => d.name || (d.app === "web" ? host(d.url) || label("web") : label(d.app));
  // A link typed or pasted -> {id, url, app, name}, or null
  function make(raw, name, id){
    const url = clean(raw); if (!url) return null;
    const app = appOf(url);
    const nm = String(name == null ? "" : name).replace(/[<>\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, NAME_MAX) || nameOf(url);
    return {id: String(id || "").replace(/[^\w-]/g, "").slice(0, 40) || "dl" + Math.random().toString(36).slice(2, 10), url, app, name: nm};
  }
  // A task's saved list, checked (sync and backups bring in anything)
  function norm(list){
    if (!Array.isArray(list)) return [];
    const seen = new Set(), out = [];
    for (const x of list) {
      if (!x || typeof x !== "object") continue;
      const d = make(x.url, x.name, x.id); if (!d || seen.has(d.url)) continue;
      seen.add(d.url); out.push(d);
      if (out.length >= MAX) break;
    }
    return out;
  }
  return {MAX, APPS, clean, appOf, nameOf, label, shown, host, make, norm};
})();
/*DOCLINKS-END*/

/* The task sheet's Documents section, the row button and the chips */
const SBDOCS = (() => {
  // Word, Excel, PowerPoint and OneNote links show Microsoft's own icon for the app (01-ms-icons, unchanged); the rest a plain badge
  const badge = app => { const a = DOCLINK.APPS[app] || DOCLINK.APPS.web; if (typeof MS_ICON !== "undefined" && MS_ICON[app]) return `<span class="dl-badge dl-ms" aria-hidden="true"><img src="${MS_ICON[app].s20}" alt="" width="20" height="20" draggable="false"></span>`; return `<span class="dl-badge dl-${esc(app)}" aria-hidden="true">${a[1] ? esc(a[1]) : '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>'}</span>`; };
  const list = t => DOCLINK.norm(t && t.docs);
  // The editing part of the task sheet (shown under Notes)
  function formHtml(t){
    return `<fieldset class="dl-fs" id="dlFs"><legend>Documents <span class="hint">Google Docs, Microsoft 365, OneNote, Canva</span></legend>
      <ul class="dl-edit" id="dlList"></ul>
      <div class="cl-new"><input type="url" id="dlNew" placeholder="Paste a link to the document" maxlength="2000" data-noenter aria-label="Link to a document" autocomplete="off"><button type="button" class="btn small" id="dlAdd">Add</button></div>
      <p class="mini dl-msg" id="dlMsg" aria-live="polite"></p></fieldset>`;
  }
  // Wires the section in the open sheet; value() is what Save keeps
  function wire(root, t){
    let docs = list(t);
    const ul = root.querySelector("#dlList"), inp = root.querySelector("#dlNew"), msg = root.querySelector("#dlMsg");
    if (!ul || !inp) return {value: () => list(t)};
    const draw = () => {
      ul.innerHTML = docs.map((d, i) => `<li>${badge(d.app)}<input type="text" data-i="${i}" value="${esc(d.name)}" placeholder="${esc(DOCLINK.shown(Object.assign({}, d, {name: ""})))}" maxlength="120" data-noenter aria-label="Name for ${esc(DOCLINK.label(d.app))} link ${i + 1}"><button type="button" class="link-btn" data-dl-open="${i}">Open</button><button type="button" class="icon-btn" data-dl-rm="${i}" aria-label="Remove ${esc(DOCLINK.shown(d))}">×</button></li>`).join("");
      ul.hidden = !docs.length;
    };
    const add = () => {
      const raw = inp.value.trim(); if (!raw) return;
      const d = DOCLINK.make(raw);
      if (!d) { msg.textContent = "That doesn't look like a web address. Copy the link from the document's Share button."; return; }
      if (docs.some(x => x.url === d.url)) { msg.textContent = "That link is already here."; inp.value = ""; return; }
      if (docs.length >= DOCLINK.MAX) { msg.textContent = `A task can keep ${DOCLINK.MAX} links.`; return; }
      docs.push(d); inp.value = ""; msg.textContent = `Added ${DOCLINK.label(d.app)}.`; draw(); inp.focus();
    };
    root.querySelector("#dlAdd").addEventListener("click", add);
    inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); add(); } });
    inp.addEventListener("paste", () => setTimeout(() => { if (DOCLINK.clean(inp.value)) add(); }, 0));
    ul.addEventListener("input", e => { const i = e.target.dataset.i; if (i != null && docs[i]) docs[i].name = e.target.value; });
    ul.addEventListener("click", e => {
      const o = e.target.closest("[data-dl-open]"), r = e.target.closest("[data-dl-rm]");
      if (o && docs[o.dataset.dlOpen]) openOutside(docs[o.dataset.dlOpen].url);
      if (r) { const gone = docs.splice(Number(r.dataset.dlRm), 1)[0]; msg.textContent = gone ? `Removed ${DOCLINK.shown(gone)}. Save to keep the change.` : ""; draw(); }
    });
    draw();
    // a link still in the box when Save is pressed is kept too
    return {value: () => { const raw = inp.value.trim(), d = raw && DOCLINK.make(raw); return DOCLINK.norm(d && !docs.some(x => x.url === d.url) ? docs.concat(d) : docs); }};
  }
  // On a task row: one link opens it, several open a short list
  function rowBtn(t){
    const ds = list(t); if (!ds.length) return "";
    const one = ds.length === 1, what = one ? DOCLINK.shown(ds[0]) : `${ds.length} documents`;
    return `<button type="button" class="dl-go" data-act="dl-go" data-id="${esc(t.id)}" title="Open ${esc(what)}" aria-label="Open ${esc(what)} for ${esc(t.title)}">${badge(one ? ds[0].app : "web")}${one ? "" : `<span class="dl-n">${ds.length}</span>`}</button>`;
  }
  // For the Linked row at the top of the task sheet
  const chips = t => list(t).map(d => ({k: "doc", id: d.id, url: d.url, app: d.app, name: DOCLINK.shown(d), badge: badge(d.app), why: "attached"}));
  function pick(t){
    const ds = list(t); if (!ds.length) return;
    if (ds.length === 1) { openOutside(ds[0].url); return; }
    openSheet(`<div class="sheet dl-pick">${head("Documents")}<div class="sheet-body"><div class="menu-list">${ds.map(d => `<button type="button" data-act="dl-url" data-url="${esc(d.url)}">${badge(d.app)}<span>${esc(DOCLINK.shown(d))}<span class="sub">${esc(DOCLINK.label(d.app))}</span></span></button>`).join("")}</div></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Close</button></div></div>`);
  }
  hook("act", (act, el, id) => {
    if (act === "dl-go") { const t = state.tasks[id]; if (t) pick(t); return true; }
    if (act === "dl-url") { openOutside(el.dataset.url); if (dlg.open && el.closest(".dl-pick")) dlg.close(); return true; }
    return false;
  });
  const css = document.createElement("style");
  css.textContent = `
.dl-edit{list-style:none;margin:0 0 8px;padding:0;display:flex;flex-direction:column;gap:6px}
.dl-edit li{display:flex;align-items:center;gap:8px;min-width:0}
.dl-edit li input{flex:1 1 auto;min-width:0}
.dl-msg:empty{display:none}
.dl-badge{flex:none;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:5px;font-size:.72rem;font-weight:800;line-height:1;color:#fff;background:#5f6368}
.dl-gdoc{background:#1a65d6}.dl-gsheet{background:#137333}.dl-gslides{background:#a35200}.dl-gform{background:#6a3fb0}.dl-gdrive{background:#5f6368}
.dl-word{background:#185abd}.dl-excel{background:#107c41}.dl-ppt{background:#b7361a}.dl-onenote{background:#7719aa}.dl-m365{background:#3b4a5c}
.dl-canva{background:#087983}.dl-web{background:#5f6368}
.dl-badge.dl-ms{background:none;border-radius:0}
.dl-ms img{display:block;width:100%;height:100%}
.dl-go{display:inline-flex;align-items:center;gap:3px;min-width:32px;min-height:32px;justify-content:center;padding:0 4px;border:0;border-radius:8px;background:transparent;color:var(--muted);cursor:pointer;font:inherit}
.dl-go:hover{background:color-mix(in srgb,var(--accent) 10%,transparent)}
.dl-go:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.dl-n{font-size:.75rem;font-weight:700}
.menu-list .dl-badge{margin-right:10px}
.lk-chip .dl-badge{width:16px;height:16px;font-size:.62rem;border-radius:4px}
.card-foot .dl-go{margin-left:auto;min-width:24px;min-height:24px}
.card-foot .dl-go+.lms-go{margin-left:0}
@media (pointer:coarse){.dl-go{min-width:44px;min-height:44px}}
@media (max-width:639px){.card-foot .dl-go,.plan-side .dl-go{display:none}}
`;
  document.head.appendChild(css);
  return {formHtml, wire, rowBtn, chips, pick, badge};
})();
window.SBDOCS = SBDOCS;
