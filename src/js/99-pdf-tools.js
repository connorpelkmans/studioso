/* ===== module: 99-pdf-tools.js ===== */
/* Studyboard Pro: PDF tools in Files: Convert (PDF to Word or pictures; Word, PowerPoint or pictures to PDF) and PDF Batch
   (the same change to many PDFs at once). Also the groundwork for group review (off: see GROUP-REVIEW.md). */
var SBPDFT = null;
/*PDFTOOLS-START*/
// Word: paragraphs (with headings and simple styles) to a .docx's document.xml body
const pdtX = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
function pdtDocxBody(blocks){
  return blocks.map(b => {
    if (b.pageBreak) return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
    const st = b.style ? `<w:pPr><w:pStyle w:val="${b.style}"/></w:pPr>` : "";
    return `<w:p>${st}${(b.runs || [{t: b.t}]).map(r => `<w:r>${r.b || r.i ? `<w:rPr>${r.b ? "<w:b/>" : ""}${r.i ? "<w:i/>" : ""}</w:rPr>` : ""}<w:t xml:space="preserve">${pdtX(r.t)}</w:t></w:r>`).join("")}</w:p>`;
  }).join("");
}
// A PDF's text as paragraphs: lines from the text pieces, paragraphs from the gaps, headings from bigger type
function pdtParagraphs(pages){
  const blocks = [];
  pages.forEach((items, pi) => {
    if (pi) blocks.push({pageBreak: true});
    const its = items.filter(it => it.str && it.str.trim());
    const sizes = its.map(it => it.fs).sort((a, b) => a - b), mid = sizes[Math.floor(sizes.length / 2)] || 11;
    const lines = [];
    its.forEach(it => { const ln = lines.find(l => Math.abs(l.y - it.y) < it.fs * 0.35); if (ln) { ln.items.push(it); ln.fs = Math.max(ln.fs, it.fs); } else lines.push({y: it.y, fs: it.fs, items: [it]}); });
    lines.sort((a, b) => b.y - a.y).forEach(l => { l.items.sort((a, b) => a.x - b.x); l.t = l.items.map(i => i.str).join(" ").replace(/\s+/g, " ").trim(); l.x = l.items[0].x; });
    let cur = null, prev = null;
    lines.forEach(l => {
      const big = l.fs > mid * 1.25, gap = prev ? prev.y - l.y : 0;
      if (big) { blocks.push({style: l.fs > mid * 1.7 ? "Heading1" : "Heading2", t: l.t}); cur = null; prev = l; return; }
      if (!cur || gap > Math.max(prev.fs, l.fs) * 1.75 || Math.abs(l.x - (cur.x0 || l.x)) > l.fs * 2.5 || /^([•\-–*]|\d+[.)])\s/.test(l.t)) { cur = {t: l.t, x0: l.x}; blocks.push(cur); }
      else cur.t = /[a-z]-$/.test(cur.t) ? cur.t.slice(0, -1) + l.t : cur.t + " " + l.t;
      prev = l;
    });
  });
  return blocks.map(b => b.pageBreak ? b : {style: b.style, t: b.t});
}
// Word to PDF: the parts of a .docx we lay out (paragraphs with runs, list items, tables, pictures, page breaks)
function pdtReadDocx(xml, rels){
  const doc = new DOMParser().parseFromString(xml, "application/xml"), W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const kids = (el, name) => [...el.childNodes].filter(n => n.nodeType === 1 && n.localName === name);
  const kid = (el, name) => kids(el, name)[0] || null;
  const val = el => el ? (el.getAttributeNS(W, "val") || el.getAttribute("w:val")) : null;
  const on = el => !!el && !/^(0|false|off)$/i.test(val(el) || "true");
  function para(p){
    const ppr = kid(p, "pPr"), style = ppr && val(kid(ppr, "pStyle")) || "", list = !!(ppr && kid(ppr, "numPr")), jc = ppr && val(kid(ppr, "jc")) || "";
    const runs = []; let pageBreak = false; const pics = [];
    const walk = node => { [...node.childNodes].forEach(n => { if (n.nodeType !== 1) return;
      if (n.localName === "r") {
        const rpr = kid(n, "rPr"), b = !!(rpr && on(kid(rpr, "b"))), i = !!(rpr && on(kid(rpr, "i"))), sz = rpr && Number(val(kid(rpr, "sz"))) / 2 || 0, col = rpr && val(kid(rpr, "color")) || "";
        [...n.childNodes].forEach(c => { if (c.nodeType !== 1) return;
          if (c.localName === "t") runs.push({t: c.textContent, b, i, sz, col});
          else if (c.localName === "tab") runs.push({t: "    ", b, i, sz, col});
          else if (c.localName === "br") { if ((c.getAttributeNS(W, "type") || c.getAttribute("w:type")) === "page") pageBreak = true; else runs.push({t: "\n", b, i, sz, col}); }
          else if (c.localName === "drawing") { const blip = c.getElementsByTagNameNS("*", "blip")[0], ext = c.getElementsByTagNameNS("*", "extent")[0], id = blip && (blip.getAttribute("r:embed") || blip.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "embed")); if (id && rels[id]) pics.push({src: rels[id], w: ext ? Number(ext.getAttribute("cx")) / 12700 : 0, h: ext ? Number(ext.getAttribute("cy")) / 12700 : 0}); }
        });
      } else if (n.localName === "hyperlink" || n.localName === "smartTag" || n.localName === "ins") walk(n);
    }); };
    walk(p);
    return {k: "p", style, list, jc, runs, pageBreak, pics};
  }
  const body = doc.getElementsByTagNameNS(W, "body")[0], out = [];
  if (!body) return out;
  [...body.childNodes].forEach(n => { if (n.nodeType !== 1) return;
    if (n.localName === "p") out.push(para(n));
    else if (n.localName === "tbl") out.push({k: "table", rows: kids(n, "tr").map(tr => kids(tr, "tc").map(tc => kids(tc, "p").map(para)))});
  });
  return out;
}
// The words of some runs as pieces to lay out: each word with the space after it and its own style
function pdtTokens(runs){ const out = []; runs.forEach(r => { String(r.t).split(/(\n| +)/).forEach(w => { if (!w) return; if (w === "\n") out.push({br: true}); else out.push(Object.assign({}, r, {t: w})); }); }); return out; }
/*PDFTOOLS-END*/

/* Group review: the groundwork only (off). When it's on, a study group's highlights and comments on the same PDF show for everyone in the group.
   Only the markup is ever shared, never the PDF: each member opens their own copy, matched by its content (a hash), so nobody gets a file
   they don't already have. See GROUP-REVIEW.md for the plan, the data model, the database draft and what's needed before it's switched on. */
/*REVIEW-START*/
const REVIEW_ON = false;
const REVIEW_KINDS = ["hl", "ul", "so", "note", "ink"];
// One shared mark, checked the same way on every device (the server checks it again)
function reviewNorm(x){
  if (!x || typeof x !== "object") return null;
  const id = String(x.id || ""), fk = String(x.fk || ""), gid = String(x.gid || ""), uid0 = String(x.uid || "");
  if (!/^[\w-]{6,64}$/.test(id) || !/^[a-f0-9]{64}$/.test(fk) || !/^[\w-]{1,64}$/.test(gid) || !/^[\w-]{1,64}$/.test(uid0)) return null;
  const k = REVIEW_KINDS.includes(x.k) ? x.k : null; if (!k) return null;
  const p = Math.round(Number(x.p)); if (!(p >= 1 && p <= 99999)) return null;
  const num = v => { v = Number(v); return Number.isFinite(v) ? Math.max(0, Math.min(1, Math.round(v * 10000) / 10000)) : null; };
  const out = {id, fk, gid, uid: uid0, name: String(x.name || "").slice(0, 60), k, p, upd: Math.max(0, Math.round(Number(x.upd) || 0)), at: Math.max(0, Math.round(Number(x.at) || 0))};
  if (x.del) { out.del = true; return out; }   // a tombstone: removed, kept so the removal reaches every device
  if (k === "note") { const a = Array.isArray(x.r) && x.r[0]; if (!a) return null; const r = [num(a[0]), num(a[1]), 0.022, 0.022]; if (r.some(v => v == null)) return null; out.r = [r]; }
  else if (k === "ink") { if (typeof x.d !== "string" || !/^[A-Za-z0-9_-]{3,24000}$/.test(x.d)) return null; out.d = x.d; }
  else { const rs = (Array.isArray(x.r) ? x.r : []).slice(0, 60).map(r => Array.isArray(r) && r.length === 4 ? r.map(num) : null).filter(r => r && r.every(v => v != null)); if (!rs.length) return null; out.r = rs; }
  // a short excerpt at most (the marked words, for the list), never the page's text: the PDF's words stay with its owners
  if (typeof x.t === "string") out.t = x.t.slice(0, 200);
  if (typeof x.cm === "string") out.cm = x.cm.slice(0, 2000);
  if (typeof x.c === "string" && /^[a-z]{1,12}$/.test(x.c)) out.c = x.c;
  if (typeof x.re === "string" && /^[\w-]{6,64}$/.test(x.re)) out.re = x.re;   // a reply to another mark's comment
  return out;
}
// Two copies of the same marks (this device and the server, or two devices): the newer change of each wins; removals travel as tombstones
function reviewMerge(a, b){
  const m = new Map();
  [...(a || []), ...(b || [])].map(reviewNorm).filter(Boolean).forEach(x => { const y = m.get(x.id); if (!y || x.upd > y.upd || (x.upd === y.upd && x.del && !y.del)) m.set(x.id, x); });
  return [...m.values()].sort((x, y) => x.p - y.p || x.at - y.at);
}
// Who may do what: anyone in the group adds marks and replies; you change or remove your own; the group's owner removes any
function reviewCan(action, item, me, role){
  if (!REVIEW_ON || !me) return false;
  if (action === "add" || action === "reply") return role === "owner" || role === "member";
  if (action === "edit") return !!item && item.uid === me;
  if (action === "remove") return !!item && (item.uid === me || role === "owner");
  return false;
}
// A PDF's identity for review: the SHA-256 of its bytes (the same file on every member's device has the same key)
async function reviewKey(bytes){ return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(b => b.toString(16).padStart(2, "0")).join(""); }
// Where marks are kept. A store has list(fk, gid), put(item), remove(id), watch(fk, gid, onChange) → stop. This one keeps them in memory (for tests);
// the database store (Supabase, as in GROUP-REVIEW.md) is added when review is switched on.
function reviewMemoryStore(){
  const rows = new Map(), subs = new Set();
  const tell = () => subs.forEach(f => { try { f(); } catch (e) {} });
  return {
    async list(fk, gid){ return [...rows.values()].filter(x => x.fk === fk && x.gid === gid); },
    async put(item){ const x = reviewNorm(item); if (!x) throw new Error("bad mark"); const old = rows.get(x.id); if (!old || x.upd >= old.upd) rows.set(x.id, x); tell(); return x; },
    async remove(id, uid0, upd){ const old = rows.get(id); if (!old) return; rows.set(id, Object.assign({}, old, {del: true, upd, uid: old.uid})); tell(); },
    watch(fk, gid, onChange){ const f = () => onChange(); subs.add(f); return () => subs.delete(f); }
  };
}
/*REVIEW-END*/

(() => {
  const P = typeof SBPRO !== "undefined" ? SBPRO : null; if (!P) return;
  const lib = () => window.SBPDE && SBPDE.lib;
  const isPdfFile = f => !!f && f.kind === "file" && f.revs && f.revs.length && /\.pdf$/i.test(curRev(f).name || f.name);
  const pdfFiles = () => Object.values(state.files || {}).filter(isPdfFile).filter(f => ui.fCourse === "all" || !ui.fCourse ? true : (f.courseId || "") === (ui.fCourse === "general" ? "" : ui.fCourse)).sort((a, b) => a.name.localeCompare(b.name));
  const mb = n => n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";

  /* A dialog of our own (it opens over Files, or over the reader) */
  function dialogOf(id, html){
    let d = document.getElementById(id);
    if (!d) { d = document.createElement("dialog"); d.id = id; d.className = "pdt-dlg"; document.body.appendChild(d); }
    d.innerHTML = html; d.oncancel = e => { e.preventDefault(); if (!d.dataset.busy) d.close(); };
    if (!d.open) { try { d.showModal(); } catch (e) { d.setAttribute("open", ""); } }
    return d;
  }
  const head = (t, sub) => `<div class="sheet-head"><h2>${esc(t)}</h2><button type="button" class="icon-btn" data-pdt="close" aria-label="Close"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>${sub ? `<p class="mini pdt-sub">${sub}</p>` : ""}`;
  // a new file in Files (where Files is open), or a download when this device can't store files
  async function keepFile(bytes, name, type){
    const assets = await getAssets().catch(() => null);
    if (!assets) { await lib().deliver(bytes, name); return false; }
    const cid = ui.fCourse && ui.fCourse !== "all" ? (ui.fCourse === "general" ? "" : ui.fCourse) : "", folder = ui.fFolder || "other";
    const up = await assets.upload(new File([bytes], name, {type}), {type, courseId: cid, folderId: folder});
    if (type === "application/pdf") try { await idbSet("pdf:" + up.id, new Blob([bytes], {type})); } catch (e) {}
    const nf = normFile({id: uid(), name, courseId: cid, folderId: folder, kind: "file", revs: [Object.assign({assetId: up.id, size: up.sizeBytes || bytes.length, type, at: Date.now(), name}, up.localRel ? {localRel: up.localRel} : {})], created: Date.now()});
    applyChanges([{kind: "file", id: nf.id, after: nf}], `${name} added to your files`);
    return true;
  }
  async function deliverAny(bytes, name, type){
    if (inPreview()) { const dl = caps.downloads || await useCap("downloads"); if (!dl) { toast("Downloads aren't available here"); return; } await dl.save({filename: name, data: bytes}); }
    else saveBlob(name, bytes, type);
  }

  /* ---------- Convert ---------- */
  const CONV = {src: null};
  const kindOf = (name, type) => /\.pdf$/i.test(name) || type === "application/pdf" ? "pdf" : /\.docx$/i.test(name) ? "docx" : /\.pptx$/i.test(name) ? "pptx" : /^image\//.test(type || "") || /\.(png|jpe?g|webp|gif|heic)$/i.test(name) ? "img" : "";
  function convertOpen(){
    CONV.src = null;
    const pdfs = Object.values(state.files || {}).filter(f => f && f.kind === "file" && f.revs && f.revs.length && /\.(pdf|docx|pptx)$/i.test(curRev(f).name || f.name)).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 300);
    dialogOf("pdtConv", `<div class="sheet">${head("Convert", "PDF to Word or pictures; Word, PowerPoint or pictures to PDF. Done on this device: nothing is uploaded to convert it.")}
      <div class="sheet-body pdt-body">
        <div class="row-actions"><label class="btn">Choose a File<input type="file" class="sr" data-pdt-in accept=".pdf,.docx,.pptx,image/png,image/jpeg,image/webp,application/pdf" multiple></label>
          ${pdfs.length ? `<select data-pdt="pick" aria-label="Or a file in Studyboard"><option value="">Or one of your files…</option>${pdfs.map(f => `<option value="${esc(f.id)}">${esc(f.name)}</option>`).join("")}</select>` : ""}</div>
        <div id="pdtConvOpts"></div><p class="mini" id="pdtConvMsg" aria-live="polite"></p>
      </div><div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-pdt="close">Close</button></div></div>`);
  }
  function convertOptions(){
    const box = $("#pdtConvOpts"), s = CONV.src; if (!box || !s) return;
    const label = s.files.length > 1 ? `${s.files.length} pictures` : s.files[0].name;
    if (s.kind === "pdf") box.innerHTML = `<p><b>${esc(label)}</b></p>
      <fieldset class="pde-radios"><legend class="lh">Make</legend><label class="pde-chk"><input type="radio" name="pdtTo" value="docx" checked> A Word document (.docx): the text, in paragraphs and headings</label>
        <label class="pde-chk"><input type="radio" name="pdtTo" value="png"> Pictures of the pages (PNG)</label><label class="pde-chk"><input type="radio" name="pdtTo" value="jpg"> Pictures of the pages (JPEG, smaller)</label></fieldset>
      <div class="pde-row2"><label class="f"><span class="lh">Picture sharpness</span><select data-pdt="dpi"><option value="72">Screen (72 dpi)</option><option value="150" selected>Good (150 dpi)</option><option value="300">Print (300 dpi)</option></select></label>
        <label class="f"><span class="lh">Pages</span><input type="text" data-pdt="pages" placeholder="All, or 1-3, 5" style="width:10em"></label></div>
      <p class="mini">Word files get the text only (no pictures or exact layout). Several pages of pictures come as one ZIP.</p>
      <div class="row-actions"><button type="button" class="btn primary" data-pdt="go">Convert and Download</button></div>`;
    else box.innerHTML = `<p><b>${esc(label)}</b></p><p class="mini">Makes a PDF${s.kind === "docx" ? " from the document's text, headings, lists, tables and pictures" : s.kind === "pptx" ? ", one page per slide, from each slide's text boxes and pictures" : " with one picture per page"}. ${s.kind === "img" ? "" : "It's close to the original but not exact: fonts become standard ones, and some layout (columns, shapes, effects) is simplified. Letters outside Western European languages become “?” for now."}</p>
      <div class="row-actions"><button type="button" class="btn primary" data-pdt="go">Make the PDF</button></div>`;
  }
  // "1-3, 5" as page numbers (all when empty)
  const pageList = (txt, n) => { const out = new Set(); String(txt || "").split(",").forEach(part => { const m = part.trim().match(/^(\d+)\s*(?:-\s*(\d+))?$/); if (!m) return; const a = Number(m[1]), b = Number(m[2] || m[1]); for (let k = Math.max(1, a); k <= Math.min(n, b); k++) out.add(k); }); return out.size ? [...out].sort((a, b) => a - b) : Array.from({length: n}, (_, i) => i + 1); };
  async function convertGo(){
    const s = CONV.src, msg = $("#pdtConvMsg"), say = t => { if (msg) msg.innerHTML = t; }, go = document.querySelector('#pdtConv [data-pdt="go"]'); if (!s) return;
    if (go) go.disabled = true;
    try {
      if (s.kind === "pdf") {
        const to = (document.querySelector('#pdtConv input[name="pdtTo"]:checked') || {}).value, bytes = await s.bytes(0);
        await loadPdfJs(); const doc = await window.pdfjsLib.getDocument({data: bytes.slice(), ...PDF_OPTS}).promise, pages = pageList(document.querySelector('#pdtConv [data-pdt="pages"]').value, doc.numPages), base = s.files[0].name.replace(/\.pdf$/i, "");
        if (to === "docx") {
          const texts = [];
          for (const n of pages) { say(`<span class="ai-spin" aria-hidden="true"></span> Reading page ${n}…`); const tc = await (await doc.getPage(n)).getTextContent(); texts.push(tc.items.filter(it => typeof it.str === "string").map(it => ({str: it.str, x: it.transform[4], y: it.transform[5], fs: Math.hypot(it.transform[2], it.transform[3]) || 11}))); }
          const blocks = pdtParagraphs(texts);
          if (!blocks.some(b => b.t)) { say("This PDF has no text to put in a Word file. For a scan, use Recognize Text in the reader first."); return; }
          const zip = docxOf(blocks); await deliverAny(zip, base + ".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"); say(`Made ${esc(base)}.docx`);
        } else {
          const dpi = Number(document.querySelector('#pdtConv [data-pdt="dpi"]').value) || 150, files = [];
          for (const n of pages) {
            say(`<span class="ai-spin" aria-hidden="true"></span> Drawing page ${n}…`);
            const page = await doc.getPage(n), vp = page.getViewport({scale: dpi / 72}), cv = document.createElement("canvas"); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
            const ctx = cv.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height); await page.render({canvasContext: ctx, viewport: vp}).promise;
            const blob = await new Promise(res => cv.toBlob(res, to === "jpg" ? "image/jpeg" : "image/png", 0.88)); files.push({name: `${base} p${n}.${to}`, data: new Uint8Array(await blob.arrayBuffer())});
          }
          if (files.length === 1) await deliverAny(files[0].data, files[0].name, to === "jpg" ? "image/jpeg" : "image/png");
          else await deliverAny(zipMany(files), base + " pages.zip", "application/zip");
          say(`Made ${files.length} picture${files.length === 1 ? "" : "s"}`);
        }
        try { doc.destroy(); } catch (e) {}
        return;
      }
      say(`<span class="ai-spin" aria-hidden="true"></span> Making the PDF…`);
      const L = await lib().loadLib(), out = s.kind === "docx" ? await docxToPdf(L, await s.bytes(0)) : s.kind === "pptx" ? await pptxToPdf(L, await s.bytes(0)) : await imagesToPdf(L, s);
      const name = (s.files.length > 1 ? "Pictures" : s.files[0].name.replace(/\.(docx|pptx|png|jpe?g|webp|gif|heic)$/i, "")) + ".pdf";
      const kept = await keepFile(out.bytes, name, "application/pdf");
      say(`${kept ? "Added" : "Downloaded"} ${esc(name)} (${out.pages} page${out.pages === 1 ? "" : "s"})${out.note ? ". " + esc(out.note) : ""}`);
    } catch (err) { say(esc((err && err.message) || "Couldn't convert that file.")); }
    finally { if (go) go.disabled = false; }
  }
  function docxOf(blocks){
    const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main", H = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    const sty = (id, name, rpr, ppr) => `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr>${ppr}</w:pPr><w:rPr>${rpr}</w:rPr></w:style>`;
    const styles = H + `<w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>`
      + sty("Heading1", "heading 1", '<w:b/><w:sz w:val="32"/><w:szCs w:val="32"/>', '<w:keepNext/><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="0"/>') + sty("Heading2", "heading 2", '<w:b/><w:sz w:val="26"/><w:szCs w:val="26"/>', '<w:keepNext/><w:spacing w:before="200" w:after="80"/><w:outlineLvl w:val="1"/>') + `</w:styles>`;
    return zipMany([
      {name: "[Content_Types].xml", data: H + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'},
      {name: "_rels/.rels", data: H + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'},
      {name: "word/document.xml", data: H + `<w:document xmlns:w="${W}"><w:body>${pdtDocxBody(blocks)}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`},
      {name: "word/_rels/document.xml.rels", data: H + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
      {name: "word/styles.xml", data: styles}
    ]);
  }
  // Laying out styled words on pages (for Word and PowerPoint): fonts, wrapping, new pages
  async function layoutKit(L, doc){
    const fonts = {}, f = async k => fonts[k] || (fonts[k] = await doc.embedFont(L.StandardFonts[k]));
    const fontFor = async r => f(r.serif ? (r.b && r.i ? "TimesRomanBoldItalic" : r.b ? "TimesRomanBold" : r.i ? "TimesRomanItalic" : "TimesRoman") : (r.b && r.i ? "HelveticaBoldOblique" : r.b ? "HelveticaBold" : r.i ? "HelveticaOblique" : "Helvetica"));
    const clean = t => [...pdeTidy(t)].map(ch => pdeBadChars(ch).length ? "?" : ch).join("");
    const rgb = hex => { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ""); const v = m ? parseInt(m[1], 16) : 0; return L.rgb((v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255); };
    // words into lines no wider than w: [{toks: [{t, font, size, color, w}], h, w}]
    async function lines(runs, w, base){
      const out = []; let line = {toks: [], w: 0, h: 0};
      for (const tk of pdtTokens(runs)) {
        if (tk.br) { out.push(line); line = {toks: [], w: 0, h: base * 1.25}; continue; }
        const font = await fontFor(tk), size = tk.sz || base, t = clean(tk.t), tw = font.widthOfTextAtSize(t, size);
        if (line.w + tw > w && line.toks.length && t.trim()) { out.push(line); line = {toks: [], w: 0, h: 0}; if (!t.trim()) continue; }
        line.toks.push({t, font, size, color: rgb(tk.col), w: tw}); line.w += tw; line.h = Math.max(line.h, size * 1.25);
      }
      if (line.toks.length || !out.length) out.push(line);
      out.forEach(l => { if (!l.h) l.h = base * 1.25; });
      return out;
    }
    return {lines, fontFor, clean, rgb, f};
  }
  async function docxToPdf(L, bytes){
    const files = await unzipBytes(bytes, n => n === "word/document.xml" || n === "word/_rels/document.xml.rels" || /^word\/media\//.test(n), {max: 40e6});
    const dec = new TextDecoder(), xml = files["word/document.xml"]; if (!xml) throw new Error("That isn't a Word document Studyboard can read.");
    const rels = {}; if (files["word/_rels/document.xml.rels"]) dec.decode(files["word/_rels/document.xml.rels"]).replace(/<Relationship [^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g, (m, id, t) => { rels[id] = "word/" + t.replace(/^\.?\//, ""); });
    const blocks = pdtReadDocx(dec.decode(xml), rels), doc = await L.PDFDocument.create(), K = await layoutKit(L, doc);
    const PW = 612, PH = 792, M = 72, CW = PW - M * 2; let page = doc.addPage([PW, PH]), y = PH - M, skipped = 0;
    const newPage = () => { page = doc.addPage([PW, PH]); y = PH - M; };
    const sizes = {Title: 26, Heading1: 18, Heading2: 15, Heading3: 13};
    async function drawPara(p, x, w, base){
      const sz = sizes[p.style] || 0, runs = p.runs.map(r => Object.assign({}, r, sz ? {sz: r.sz || sz, b: true} : {}));
      if (p.list) runs.unshift({t: "•  ", sz: base});
      const ls = await K.lines(runs, w - (p.list ? 0 : 0), sz || base);
      for (const l of ls) {
        if (y - l.h < M) newPage();
        let lx = x + (p.list ? 0 : 0); if (p.jc === "center") lx = x + (w - l.w) / 2; else if (p.jc === "right") lx = x + w - l.w;
        y -= l.h; l.toks.forEach(t => { if (t.t.trim()) page.drawText(t.t, {x: lx, y: y + l.h * 0.22, size: t.size, font: t.font, color: t.color}); lx += t.w; });
      }
      return ls.reduce((s0, l) => s0 + l.h, 0);
    }
    for (const b of blocks) {
      if (b.k === "p") {
        if (b.pageBreak && b.runs.every(r => !r.t.trim())) { newPage(); continue; }
        if (b.runs.some(r => r.t.trim()) || !b.pics.length) { await drawPara(b, M + (b.list ? 18 : 0), CW - (b.list ? 18 : 0), 11); y -= sizes[b.style] ? 6 : 4; }
        for (const pic of b.pics) {
          const data = files[pic.src]; if (!data || !/\.(png|jpe?g)$/i.test(pic.src)) { skipped++; continue; }
          const img = /\.png$/i.test(pic.src) ? await doc.embedPng(data) : await doc.embedJpg(data), w0 = pic.w || img.width * 0.75, h0 = pic.h || img.height * 0.75, k = Math.min(1, CW / w0, (PH - M * 2) / h0);
          if (y - h0 * k < M) newPage(); y -= h0 * k; page.drawImage(img, {x: M, y, width: w0 * k, height: h0 * k}); y -= 6;
        }
        if (b.pageBreak) newPage();
      } else if (b.k === "table") {
        // a table: equal columns with borders, each row as tall as its tallest cell
        for (const row of b.rows) {
          const cols = Math.max(1, row.length), cw = CW / cols; let h = 0; const cells = [];
          for (const cell of row) { let ch = 0; const ls = []; for (const p of cell) { const l = await K.lines(p.runs, cw - 8, 10); ls.push(...l); ch += l.reduce((s0, x) => s0 + x.h, 0); } cells.push(ls); h = Math.max(h, ch + 8); }
          if (y - h < M) newPage();
          cells.forEach((ls, k) => { const x0 = M + k * cw; page.drawRectangle({x: x0, y: y - h, width: cw, height: h, borderColor: L.rgb(0.6, 0.6, 0.6), borderWidth: 0.6}); let yy = y - 4; ls.forEach(l => { yy -= l.h; let lx = x0 + 4; l.toks.forEach(t => { if (t.t.trim()) page.drawText(t.t, {x: lx, y: yy + l.h * 0.22, size: t.size, font: t.font, color: t.color}); lx += t.w; }); }); });
          y -= h;
        }
        y -= 8;
      }
    }
    pdeStamp(doc);
    return {bytes: await doc.save(), pages: doc.getPageCount(), note: skipped ? `${skipped} picture${skipped === 1 ? " wasn't a PNG or JPEG, so it was" : "s weren't PNG or JPEG, so they were"} left out` : ""};
  }
  async function pptxToPdf(L, bytes){
    const files = await unzipBytes(bytes, n => /^ppt\/(presentation\.xml|_rels\/presentation\.xml\.rels|slides\/slide\d+\.xml|slides\/_rels\/slide\d+\.xml\.rels|media\/.+)$/.test(n), {max: 40e6});
    const dec = new TextDecoder(), pres = files["ppt/presentation.xml"] ? dec.decode(files["ppt/presentation.xml"]) : ""; if (!pres) throw new Error("That isn't a PowerPoint file Studyboard can read.");
    const sz = /<p:sldSz[^>]*cx="(\d+)"[^>]*cy="(\d+)"/.exec(pres), PW = sz ? Number(sz[1]) / 12700 : 720, PH = sz ? Number(sz[2]) / 12700 : 540;
    const prels = {}; if (files["ppt/_rels/presentation.xml.rels"]) dec.decode(files["ppt/_rels/presentation.xml.rels"]).replace(/<Relationship [^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g, (m, id, t) => { prels[id] = "ppt/" + t.replace(/^\.?\//, ""); });
    const order = [...pres.matchAll(/<p:sldId [^>]*r:id="([^"]+)"/g)].map(m => prels[m[1]]).filter(Boolean);
    const doc = await L.PDFDocument.create(), K = await layoutKit(L, doc); let skipped = 0;
    for (const sp of order) {
      const xml = files[sp] ? dec.decode(files[sp]) : ""; if (!xml) continue;
      const page = doc.addPage([PW, PH]), sx = new DOMParser().parseFromString(xml, "application/xml");
      const rels = {}; const rf = files[sp.replace(/slides\/(slide\d+\.xml)$/, "slides/_rels/$1.rels")]; if (rf) dec.decode(rf).replace(/<Relationship [^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g, (m, id, t) => { rels[id] = "ppt/" + t.replace(/^\.\.\//, ""); });
      const box = el => { const off = el.getElementsByTagNameNS("*", "off")[0], ext = el.getElementsByTagNameNS("*", "ext")[0]; return off && ext ? {x: Number(off.getAttribute("x")) / 12700, y: Number(off.getAttribute("y")) / 12700, w: Number(ext.getAttribute("cx")) / 12700, h: Number(ext.getAttribute("cy")) / 12700} : null; };
      let auto = 40;
      for (const el of [...sx.getElementsByTagNameNS("*", "spTree")[0] ? sx.getElementsByTagNameNS("*", "spTree")[0].children : []]) {
        if (el.localName === "pic") {
          const blip = el.getElementsByTagNameNS("*", "blip")[0], id = blip && (blip.getAttribute("r:embed") || blip.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "embed")), b = box(el), src = id && rels[id], data = src && files[src];
          if (!data || !b || !/\.(png|jpe?g)$/i.test(src)) { skipped++; continue; }
          const img = /\.png$/i.test(src) ? await doc.embedPng(data) : await doc.embedJpg(data); page.drawImage(img, {x: b.x, y: PH - b.y - b.h, width: b.w, height: b.h}); continue;
        }
        if (el.localName !== "sp") continue;
        const tx = el.getElementsByTagNameNS("*", "txBody")[0]; if (!tx) continue;
        const ph = el.getElementsByTagNameNS("*", "ph")[0], phType = ph ? ph.getAttribute("type") || "body" : "";
        // a placeholder without its own place takes the usual one (title at the top, the body under it)
        const b = box(el) || (/title/i.test(phType) ? {x: PW * 0.06, y: PH * 0.06, w: PW * 0.88, h: PH * 0.16} : {x: PW * 0.06, y: PH * 0.26, w: PW * 0.88, h: PH * 0.68});
        let yy = PH - b.y - 4, first = true;
        for (const p of [...tx.getElementsByTagNameNS("*", "p")]) {
          const runs = [...p.getElementsByTagNameNS("*", "r")].map(r => { const pr = r.getElementsByTagNameNS("*", "rPr")[0], t = r.getElementsByTagNameNS("*", "t")[0]; return {t: t ? t.textContent : "", b: pr && pr.getAttribute("b") === "1", i: pr && pr.getAttribute("i") === "1", sz: pr && pr.getAttribute("sz") ? Number(pr.getAttribute("sz")) / 100 : 0}; });
          if (!runs.some(r => r.t.trim())) { yy -= 8; continue; }
          const base = /title/i.test(phType) ? 32 : 18, bullet = !/title/i.test(phType) && phType && !/ctrTitle|subTitle/i.test(phType);
          if (bullet) runs.unshift({t: "•  ", sz: runs[0].sz || base});
          for (const l of await K.lines(runs, b.w - 8, base)) { yy -= l.h; if (yy < PH - b.y - b.h - 40 || yy < 10) break; let lx = b.x + 4; l.toks.forEach(t => { if (t.t.trim()) page.drawText(t.t, {x: lx, y: yy + l.h * 0.22, size: t.size, font: t.font, color: t.color}); lx += t.w; }); }
          yy -= 4; first = false;
        }
        void first; void auto;
      }
    }
    if (!doc.getPageCount()) throw new Error("No slides found in that file.");
    pdeStamp(doc);
    return {bytes: await doc.save(), pages: doc.getPageCount(), note: skipped ? `${skipped} picture${skipped === 1 ? " was" : "s were"} left out (not PNG or JPEG)` : ""};
  }
  async function imagesToPdf(L, s){
    const doc = await L.PDFDocument.create();
    for (let k = 0; k < s.files.length; k++) {
      let bmp; try { bmp = await createImageBitmap(s.files[k], {imageOrientation: "from-image"}); } catch (e) { continue; }
      const sc = Math.min(1, 2400 / Math.max(bmp.width, bmp.height)), cv = document.createElement("canvas"); cv.width = Math.round(bmp.width * sc); cv.height = Math.round(bmp.height * sc); cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height);
      const png = /png|gif|webp/i.test(s.files[k].type), blob = await new Promise(res => cv.toBlob(res, png ? "image/png" : "image/jpeg", 0.88)), data = new Uint8Array(await blob.arrayBuffer());
      const img = png ? await doc.embedPng(data) : await doc.embedJpg(data), w = 612, h = Math.round(612 * cv.height / cv.width); doc.addPage([w, h]).drawImage(img, {x: 0, y: 0, width: w, height: h});
    }
    if (!doc.getPageCount()) throw new Error("None of those pictures could be read.");
    pdeStamp(doc);
    return {bytes: await doc.save(), pages: doc.getPageCount()};
  }

  /* ---------- PDF Batch: one change to many PDFs ---------- */
  const BATCH = {stop: false};
  function batchOpen(){
    const list = pdfFiles(), m = lib() ? lib().me() : {};
    if (!list.length) { toast("No PDFs here to change"); return; }
    dialogOf("pdtBatch", `<div class="sheet">${head("PDF Batch", "The same change to several PDFs at once. Each one gets a new version (passwords make a ZIP to download instead).")}
      <div class="sheet-body pdt-body">
        <div class="row-actions"><button type="button" class="link-btn" data-pdt="all">Select All</button><button type="button" class="link-btn" data-pdt="none">Select None</button></div>
        <ul class="pdt-files">${list.map(f => `<li><label class="pde-chk"><input type="checkbox" data-pdt-f="${esc(f.id)}"> ${esc(f.name)} <span class="mini">${mb(curRev(f).size || 0)}</span></label><span class="mini" data-pdt-st="${esc(f.id)}"></span></li>`).join("")}</ul>
        <label class="f"><span class="lh">Change</span><select data-pdt="act"><option value="small">Make smaller</option><option value="header">Add a header and page numbers</option><option value="wm">Add a watermark</option><option value="lock">Lock form answers and markup</option><option value="pw">Protect with a password (download a ZIP)</option>${aiReady() ? `<option value="ocr">Recognize text in scans (uses AI)</option>` : ""}</select></label>
        <div id="pdtBatchOpts"></div><p class="mini" id="pdtBatchMsg" aria-live="polite"></p>
      </div><div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-pdt="close">Close</button><button type="button" class="btn primary" data-pdt="run">Change Them</button></div></div>`);
    batchOptions();
    void m;
  }
  function batchOptions(){
    const box = $("#pdtBatchOpts"), act = (document.querySelector('#pdtBatch [data-pdt="act"]') || {}).value, m = lib() ? lib().me() : {}; if (!box) return;
    box.innerHTML = act === "small" ? `<label class="f"><span class="lh">How small</span><select data-pdt="dpi"><option value="150">Smaller (pictures at 150 dpi)</option><option value="100">Smallest (pictures at 100 dpi)</option></select></label>`
      : act === "header" ? `<label class="f"><span class="lh">Header</span><input type="text" data-pdt="htext" maxlength="200" value="${esc([m.name, lib() ? lib().todayText() : ""].filter(Boolean).join(" · "))}"></label><label class="f"><span class="lh">Page numbers</span><select data-pdt="hnum"><option value="bc">Bottom center: Page 1 of 9</option><option value="br">Bottom right: Page 1 of 9</option><option value="none">None</option></select></label>`
      : act === "wm" ? `<label class="f"><span class="lh">Watermark</span><input type="text" data-pdt="wm" maxlength="60" value="DRAFT"></label>`
      : act === "pw" ? `<div class="pde-row2"><label class="f"><span class="lh">Password</span><input type="password" data-pdt="pw1" autocomplete="new-password"></label><label class="f"><span class="lh">Type it again</span><input type="password" data-pdt="pw2" autocomplete="new-password"></label></div><p class="mini">Studyboard doesn't keep the password, so remember it. Your copies in Studyboard stay without one.</p>`
      : act === "ocr" ? (() => { const W = lib().aiWhoGets(); return `<div class="pde-ai-note" role="note"><b>Pictures of the pages are sent to ${esc(W.company)}.</b> For each PDF you pick, Studyboard sends a picture of each page that has no text yet to <b>${esc(W.company)} ${esc(W.product)}</b> to read its words. Nothing else is sent. Pages that already have text are skipped.</div>`; })()
      : `<p class="mini">Form answers and highlights or comments saved into these PDFs become part of the page.</p>`;
  }
  async function batchRun(){
    const d = document.getElementById("pdtBatch"), ids = [...d.querySelectorAll("[data-pdt-f]:checked")].map(x => x.dataset.pdtF), act = d.querySelector('[data-pdt="act"]').value, msg = $("#pdtBatchMsg");
    if (!ids.length) { msg.textContent = "Pick the PDFs to change."; return; }
    const val = k => (d.querySelector(`[data-pdt="${k}"]`) || {}).value;
    if (act === "pw" && ((val("pw1") || "").length < 4 || val("pw1") !== val("pw2"))) { msg.textContent = (val("pw1") || "").length < 4 ? "Use a password of 4 characters or more." : "The two passwords don't match."; return; }
    if (act === "ocr" && !(await askBox({title: "Send Page Pictures?", text: `Pictures of the pages without text in ${ids.length} PDF${ids.length === 1 ? "" : "s"} go to ${lib().aiWhoGets().company}.`, yes: "Send Them", no: "Cancel"}))) return;
    const run = d.querySelector('[data-pdt="run"]'); run.disabled = true; d.dataset.busy = "1"; BATCH.stop = false;
    const L = await lib().loadLib(), zip = []; let ok = 0, fail = 0;
    for (const fid of ids) {
      const st = d.querySelector(`[data-pdt-st="${CSS.escape(fid)}"]`), f = state.files[fid], set = t => { if (st) st.textContent = t; };
      if (!f || BATCH.stop) continue;
      try {
        set("Working…");
        const rev = curRev(f), bytes = await lib().pdfBytesOf(rev.assetId), pending = (Array.isArray(f.pe) ? f.pe : []).filter(e => e && e.a === rev.assetId);
        let out = null, label = "";
        if (act === "ocr") {
          await loadPdfJs(); const pd = await window.pdfjsLib.getDocument({data: bytes.slice(), ...PDF_OPTS}).promise, need = [];
          for (let n = 1; n <= pd.numPages; n++) { const tc = await (await pd.getPage(n)).getTextContent(); if (tc.items.filter(i => String(i.str || "").trim()).length < 3) need.push(n); }
          if (!need.length) { set("Already has text"); try { pd.destroy(); } catch (e) {} continue; }
          const read = await lib().ocrRead(pd, need, (d, t) => set(`Reading pages (${d} of ${t} done)…`)); try { pd.destroy(); } catch (e) {}
          const base = pending.length ? (await pdeBake(L, bytes, pending.map(e => Object.assign({}, e)), {})).bytes : bytes;
          out = (await lib().ocrApply(base, read)).bytes; label = `text recognized on ${need.length} page${need.length === 1 ? "" : "s"}`;
        } else {
          const edits = pending.map(e => Object.assign({}, e)).filter(e => !(act === "header" && e.k === "h") && !(act === "wm" && e.k === "m")), opts = {};
          if (act === "header") edits.push({id: uid(), a: rev.assetId, p: 1, k: "h", text: val("htext") || "", pos: "tr", num: val("hnum"), fmt: "pnn", fs: 10});
          if (act === "wm") edits.push({id: uid(), a: rev.assetId, p: 1, k: "m", text: val("wm") || "DRAFT", fs: 60, c: "#c0262d", op: 0.18});
          if (act === "lock") opts.flatten = true;
          if (act === "small") { opts.compress = Number(val("dpi")) || 150; opts.recode = lib().recode; }
          const r = await pdeBake(L, bytes, edits, opts); out = r.bytes;
          label = {small: "made smaller", header: "header and page numbers added", wm: "watermark added", lock: "locked", pw: ""}[act];
          if (act === "small" && out.length >= bytes.length * 0.97) { set("Already small"); continue; }
        }
        if (act === "pw") { zip.push({name: (curRev(f).name || f.name).replace(/(\.pdf)?$/i, ".pdf"), data: await lib().protect(out, {pw: val("pw1"), print: true, copy: false})}); set("Protected"); ok++; continue; }
        await newVersion(fid, out, label); set(act === "small" ? `Done: ${mb(bytes.length)} → ${mb(out.length)}` : "Done"); ok++;
      } catch (err) { set((err && err.message) || "Couldn't change this one"); fail++; }
    }
    if (zip.length) await deliverAny(zipMany(zip), "Protected PDFs.zip", "application/zip");
    msg.textContent = `${ok} changed${fail ? `, ${fail} couldn't be` : ""}.`; run.disabled = false; delete d.dataset.busy;
  }
  // a new version of a file, made outside the reader (highlights and handwriting come along; its edits are now in the file)
  async function newVersion(fid, bytes, label){
    const assets = await getAssets().catch(() => null); if (!assets) throw new Error("This device can't store files here");
    const f0 = state.files[fid], name = curRev(f0).name || f0.name, old = curRev(f0).assetId;
    const up = await assets.upload(new File([bytes], name, {type: "application/pdf"}), {type: "application/pdf", courseId: f0.courseId, folderId: f0.folderId});
    try { await idbSet("pdf:" + up.id, new Blob([bytes], {type: "application/pdf"})); } catch (e) {}
    const n = clone(state.files[fid]);
    n.revs = n.revs.concat(Object.assign({assetId: up.id, size: up.sizeBytes || bytes.length, type: "application/pdf", at: Date.now(), name}, up.localRel ? {localRel: up.localRel} : {}));
    if (Array.isArray(n.hl)) n.hl = n.hl.map(h => h && h.a === old ? Object.assign({}, h, {a: up.id}) : h);
    if (Array.isArray(n.ink)) n.ink = n.ink.map(s => s && s.a === old ? Object.assign({}, s, {a: up.id}) : s);
    const rest = (Array.isArray(n.pe) ? n.pe : []).filter(e => e && e.a !== old); if (rest.length) n.pe = rest; else delete n.pe;
    n.updated = Date.now();
    applyChanges([{kind: "file", id: fid, after: n}], `${n.name}: Rev ${revLetter(n.revs.length - 1)} ${label}`);
  }

  /* Wiring */
  document.addEventListener("change", async ev => {
    const t = ev.target; if (!t.closest) return;
    if (t.closest("#pdtConv")) {
      if (t.matches("[data-pdt-in]")) {
        const files = [...(t.files || [])]; t.value = ""; if (!files.length) return;
        const kinds = files.map(f => kindOf(f.name, f.type));
        if (kinds.some(k => !k)) { $("#pdtConvMsg").textContent = "Use a PDF, a Word (.docx) or PowerPoint (.pptx) file, or pictures."; return; }
        if (files.length > 1 && kinds.some(k => k !== "img")) { $("#pdtConvMsg").textContent = "Pick one document at a time (or several pictures)."; return; }
        CONV.src = {kind: kinds[0], files, bytes: async i => new Uint8Array(await files[i].arrayBuffer())}; $("#pdtConvMsg").textContent = ""; convertOptions();
      } else if (t.dataset.pdt === "pick") {
        const f = state.files[t.value]; t.value = ""; if (!f) return;
        CONV.src = {kind: kindOf(curRev(f).name || f.name, curRev(f).type), files: [{name: curRev(f).name || f.name}], bytes: async () => lib().pdfBytesOf(curRev(f).assetId)}; convertOptions();
      }
    }
    if (t.closest("#pdtBatch") && t.dataset.pdt === "act") batchOptions();
  });
  document.addEventListener("click", ev => {
    const b = ev.target.closest && ev.target.closest("[data-pdt]"); if (!b || b.tagName === "SELECT" || b.tagName === "INPUT") return;
    const d = b.closest("dialog"), k = b.dataset.pdt;
    if (k === "close") { if (d && d.dataset.busy) { BATCH.stop = true; toast("Stopping after this file…"); return; } if (d) d.close(); }
    else if (k === "go") convertGo();
    else if (k === "run") batchRun();
    else if (k === "all" || k === "none") d.querySelectorAll("[data-pdt-f]").forEach(x => { x.checked = k === "all"; });
  });
  hook("act", (act) => {
    if (act !== "pdt-convert" && act !== "pdt-batch") return false;
    if (P.locked()) { if (typeof PLAN !== "undefined" && PLAN) PLAN.openSheet("Convert and PDF Batch are part of Studyboard Pro."); return true; }
    if (!lib()) return true;
    if (act === "pdt-convert") convertOpen(); else batchOpen();
    return true;
  });
  SBPDFT = window.SBPDFT = {
    filesBtns: () => P.locked() || inPreview() ? "" : `<button type="button" class="btn small" data-act="pdt-convert">Convert</button><button type="button" class="btn small" data-act="pdt-batch">PDF Batch</button>`,
    review: {on: REVIEW_ON, norm: reviewNorm, merge: reviewMerge, can: reviewCan, key: reviewKey, memoryStore: reviewMemoryStore}
  };
  const css = document.createElement("style");
  css.textContent = `
.pdt-dlg{width:min(720px,calc(100% - 24px))}
.pdt-sub{margin:0 18px 6px}
.pdt-body{display:grid;gap:12px}
.pdt-body select{max-width:100%}
.pdt-files{list-style:none;margin:0;padding:0;display:grid;gap:4px;max-height:40vh;overflow:auto;border:1px solid var(--line);border-radius:10px;padding:6px 10px}
.pdt-files li{display:flex;align-items:center;justify-content:space-between;gap:10px}
`;
  document.head.appendChild(css);
})();
