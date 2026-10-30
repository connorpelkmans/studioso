/* ===== module: 01-notes.js: the app's core, files, sticky notes, note boards, note versions, notes to Word or Google Docs ===== */
/* Files */
const CLOUD_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 9.6 4.2 4.2 0 0 0 7 18z"/></svg>';
const FOLDER = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/></svg>';
const DEFAULT_FOLDERS = [["syllabus","Syllabus"],["assignments","Assignments"],["notes","Lecture Notes"],["exams","Exams and Quizzes"],["other","Other"]];
const MAX_FILE = 20 * 1024 * 1024;
function foldersOf(courseId){
  const src = courseId ? (state.courses[courseId] || {}).folders : state.settings.folders;
  const OLD = {notes:"Lecture notes", exams:"Exams and quizzes"};
  return Array.isArray(src) && src.length ? src.map(f => OLD[f.id] === f.name ? {id: f.id, name: DEFAULT_FOLDERS.find(d => d[0] === f.id)[1]} : f) : DEFAULT_FOLDERS.map(([id, name]) => ({id, name}));
}
const revLetter = i => i < 26 ? String.fromCharCode(65 + i) : "Z" + (i - 25);
const curRev = f => f.revs[f.revs.length - 1] || null;
function fileHref(f){ if (f.kind === "link" || f.kind === "cloud") return safeUrl(f.url) || "#"; const r = curRev(f); return r ? assetHref(r.assetId) : f.cloud ? safeUrl(f.url) || "#" : "#"; }
function fileAttr(f){ if (f.kind === "link" || f.kind === "cloud") return ""; const r = curRev(f); return r ? assetAttr(r.assetId) : ""; }
// A file's stored type and name
const fileTypeOf = f => f.cloud && !f.revs.length ? String(f.cloud.type || "") : (curRev(f) || {}).type || "";
const fileSizeOf = f => (curRev(f) || {}).size || (f.cloud && f.cloud.size) || 0;
const fileNameOf = f => f.cloud && !f.revs.length ? String(f.cloud.name || f.name) : (curRev(f) || {}).name || f.name;
const CLOUD_NAMES = {google: "Google Drive", microsoft: "OneDrive"};
// Google Drive's and OneDrive's own logos
const BRAND_LOGO = {gdrive: '<svg viewBox="0 0 87.3 78" width="22" height="20" class="brand-lg"><path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/><path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/><path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/><path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/><path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/><path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/></svg>', onedrive: '<img src="data:image/webp;base64,UklGRrIHAABXRUJQVlA4WAoAAAAQAAAAUwAANwAAQUxQSLoCAAABoGvbtmnb6nOOdf1s2/ZLbSOyjcy2Mtu2bdu27fc215pjjB4c7b3W/ICImAAMWyKApXY578kv/qlonZ9ev/7wtScDKAIaGyOw7NEvtjh++/iC9QIgDQkCrH9PRdLU3Ee4qZLk2wfOQIhNiMBq95FM5pygJSM/2wso6icoTilp6hyoKfnMqpBQswJLvkgqB2/K7qEIsS4hSlFMxvq/MTmHquTVkxDrEIuIUXcoqRy2Jz4+M+LQJAKYscJmex56qtFYw4ovzBTCcGIAljrsgR+cI521rPi4SBhCEGDje3okaSklZ00rXo5icBFY51GSSc1Z64r7QAYlKM5Umjpr79pZMsTBCBZ+nq5spPIxyEAEq37Pik1VbgsZgGC1P5nYHH+/iBOLWOwXKhus3BZT4gSCTH2biY3ypwFIGJfgEiY22/31oxYFZByCDZmYwf8vWAgxjBbi5I+ozbNE/rEfEEcpsA+VOfRE3jANcUSY9LlbFkhPfGF2RADYgspsVnxlRgwAbvWUD1a8BwLM/hs9I6x4BARb0ZlT13K5EM+hZoXKByBP0PJC41r4ip6ZxKvRYm6dv8+h2aFxJ8+P+iVVfoyv/0nPjfO3D2m5Icu7qPnhkTlK65rnxvn35E9pmTF+gHOZMqO8BSuaZcZ4oOAhalac3SUEa3te1B8DBNcyZYU7AjHO9atbPtQ/nhQBwRZMno3EbSAAChzHKheJd0AwssAFrDwLym/njHGUIDifahlQtlZHxOhBcDSZGpfYWg+CsYNg829J9SaZ8tu1UWDcBea6WMlk3gxXJe+eD4IJCrDmLSVJU/Nx18BNjeQnOwOCCQcBlj3h9T4b2X1q96mIAYOMAmCl/S577vPf/v7nn3/+/fff//77////W61Wu93udDrdbrfX6/X7/X5ZlmU1MqX+n+/fetgKAARjA1ZQOCDSBAAAcBwAnQEqVAA4AD4xFIdCoiELrdOwEAGCWoAgaxCnp35OezHXv7z+Bvx06Zwu/bz/G+2Dt2eKP1F/wA9h/6q+aB1gH8o/r///7Bn0GP2q9Mb9h/gj/ZP9vfZW/8uaOpdQVbTNPHF9K+wN+pnQ3ex3+jQX8UoPdmlX9wQddklPrs/My6HOLLtNl3QkzZvUTmCC2NqzSC69xCesELnnL407TsPsqhkHdEjKEDktPsUhBXdcYlptt4RB02rtcxWj7eV9YNGofQbo7UP7I3D1a9PW0GEGGTj6Pt9AFzy/SdkKEOcd0KeklQdBP6kgy4AA/v4+9sAu+rUQhYWXaO5WKvO90JAlcp8sY/K5ZRb9w1sLKAD4Th29vbXJiIqIty4LeXgqACX+v856aT+Scc+vS5ffcu3t3MSeBLcGJaPzmSdO6x0Cw52eoTC6Og2PlrgNe43pZx7nPueHTqGHKbs53NmWPo531wAv1u+TgwTlpNMXvpqSE3v9h6J6FeLp+tzPdNbNZJ0i85LvoDJO8+2ciiutPWsVR5k9dZSpI2RApGYd2m9x3k0o5e131+sjwjYzoffi7oAQq+Um09FGQo/JMSXxOc1pD5e6LL+y/YmGr0BD2sLFx8Sv+ubN5UTl20BwuA8bqBix5zHmbs+ecTP4Pc0FHUOVjf2oV/Scy+qeyE9xbPQ7+GWR9akAkB7qd9r7ai1e5TDtlD1TWvoBftdDNGodIDkNKN/BPrhbK6MCNzjx8Vw99fJwOVC6PipM5I5vazYiAo5Z8i3MdrNxg2e9jCR2A/0RUVif2NDxnU668BHhn+XGQqlPyTs51cP1zjjLhybPBf9KDysPlbL5jH5PKuYrVCiTSrhdwjAIOdpLUAgBMbCtiajBSGepOdf3gQRlqf60jcnZrHMqRxQha98j2bGAvsuQoaMKP4iVVswoyszQifsdfjQpLD6nCwGVy3V/CGga+QUmqQLLCcKKkbuO+ba0NiO1x36VHv7FGKenhr3ZxH/n/551o4sV4Ueipe0jXIZG2axce/JqygS6oDt94/8TN10bn2YWnUW4MDfhQ78AQFnwpd3ui14xZfxMjYF+oDEH33AikHKUuzvn3mOXPhTqtRfcpZ9yllqwfIW3MHmIFIYBJ7tY6NLMrUKrRXGEdcEs2L1UtVmWgGyXA8RHe2SWSoxH7hmN0rfjTwFGE7u5F26psnqPCPjLIrKdmmjNa+NqfQae9bwYUOY8AkRhMRwlGj1M1CmRsTRNdzHrLSDkE05uOdkmReWRIjiKmSprOHU0qyBwu0lpc8KVm2i3Gl6iCT1Vg4+2Halca+WrQWuwrVX4GJwMcH0b9s274szDhvkv92uPMffeR+IabNij96zwHQNWnzmPtO3kNhlz8ngRPHxWwy59/E3V6D1xuqQgub6qBDRAoTnjZFHR0DD3nsi/4zMzWv5hDqZUV6x4q28SZz94O6nUk4bBWE0eXyFPSnzKWcjbwbDqTztynDDJX3I57AGCOpysCPu83lymAaF61ESUu7u3lQCAfx7hciKRfWRg9gFHPjXdIsSZ/yQVL+AKOikIhtqm98O182pnuoT5RYOP2Gf0GeHvekK38X2PceR5Z264hF78tJsmco0JiPaVf+AZYeT+5RPczxDr1RuJo1AAAA==" width="24" height="16" class="brand-lg" alt="">'};
function fmtSize(b){ if (!b && b !== 0) return ""; if (b < 1024) return b + " B"; if (b < 1048576) return Math.round(b / 1024) + " KB"; return (b / 1048576).toFixed(b < 10485760 ? 1 : 0) + " MB"; }
function fileKind(f){
  if (f.kind === "link") return "link";
  const t = fileTypeOf(f), n = fileNameOf(f);
  if (t === "application/pdf" || /\.pdf$/i.test(n)) return "pdf";
  if (f.kind === "cloud" && /\.(docx?|odt|rtf|pages)$/i.test(n)) return "doc";
  if (f.kind === "cloud" && /\.(pptx?|odp|key)$/i.test(n)) return "slides";
  if (f.kind === "cloud" && /\.(xlsx?|ods|csv|numbers)$/i.test(n)) return "sheet";
  if (t.startsWith("audio/")) return "audio";
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("video/")) return "video";
  return "text";
}
function fileIcon(f){
  const k = fileKind(f);
  const label = {pdf:"PDF", image:"IMG", video:"VID", audio:"AUD", text:"TXT", link:"LINK", doc:"DOC", slides:"PPT", sheet:"XLS"}[k] || "FILE";
  return `<span class="ficon k-${k}" aria-hidden="true">${label}</span>`;
}
function mimeFor(file){
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const map = {pdf:"application/pdf", png:"image/png", jpg:"image/jpeg", jpeg:"image/jpeg", gif:"image/gif", webp:"image/webp", svg:"image/svg+xml",
    mp4:"video/mp4", webm:"video/webm", txt:"text/plain", md:"text/markdown", csv:"text/csv", json:"application/json"};
  if (map[ext]) return map[ext];
  if (/^(image|video)\//.test(file.type) && !/heic|heif|tiff/.test(file.type)) return file.type;
  return null;
}
async function getAssets(){ if (!caps.assets) caps.assets = await useCap("assets"); return caps.assets; }
const OFFICE = /\.(docx?|pptx?|xlsx?|odt|ods|odp|pages|key|numbers|zip|rar|7z|heic)$/i;
// Phone photos are 3-8 MB each, and most of what students attach is a photo of a slide
const UP_SIDE = 2400, UP_MIN = 400 * 1024;
async function shrinkForUpload(f, type){
  if (!/^image\/(jpeg|png|webp)$/.test(type) || f.size < UP_MIN || typeof document === "undefined") return {file: f, type};
  try {
    let src = null, w = 0, h = 0;
    try { src = await createImageBitmap(f, {imageOrientation: "from-image"}); w = src.width; h = src.height; } catch (e) { src = null; }
    if (!src) {
      const url = URL.createObjectURL(f);
      try { src = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("decode")); i.src = url; }); w = src.naturalWidth; h = src.naturalHeight; }
      finally { URL.revokeObjectURL(url); }
    }
    if (!w || !h) return {file: f, type};
    const k = Math.min(1, UP_SIDE / Math.max(w, h)), cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
    const cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
    const g = cv.getContext("2d"); g.drawImage(src, 0, 0, cw, ch);
    if (src.close) src.close();
    let alpha = false;
    if (type !== "image/jpeg") { const px = g.getImageData(0, 0, cw, ch).data; for (let i = 3; i < px.length; i += 16) if (px[i] < 250) { alpha = true; break; } }
    let out = "image/png";
    if (!alpha) { out = "image/jpeg"; g.globalCompositeOperation = "destination-over"; g.fillStyle = "#fff"; g.fillRect(0, 0, cw, ch); }
    const blob = await new Promise(res => cv.toBlob(res, out, 0.85));
    if (!blob || blob.size > f.size * 0.9) return {file: f, type};
    const name = out === "image/jpeg" ? f.name.replace(/\.(png|webp|jpe?g)$/i, "") + ".jpg" : f.name.replace(/\.webp$/i, ".png");
    return {file: new File([blob], name, {type: out, lastModified: f.lastModified || Date.now()}), type: out};
  } catch (e) { return {file: f, type}; }
}
async function uploadFiles(list, opts){
  if (opts && opts.cloud && window.SBCLOUD && SBCLOUD.target()) return SBCLOUD.uploadFiles(list, opts);
  const assets = await getAssets();
  if (!assets) { toast("File storage isn't available here. You can still add links to files."); return []; }
  const made = [], skipped = [], invs = [];
  let next = 0;
  const worker = async () => {
    while (next < list.length) {
      const i = next++; let f = list[i];
      let type = mimeFor(f) || (sbActive() || DESK ? (f.type || "application/octet-stream") : null);
      if (!type) { skipped.push(f.name); continue; }
      ({file: f, type} = await shrinkForUpload(f, type));
      const cap = sbActive() || DESK ? 50 : type === "image/svg+xml" ? 2 : 20;
      if (f.size > cap * 1048576) { toast(`${f.name} is over ${cap} MB and can't be stored`); continue; }
      toast(list.length > 1 ? `Uploading ${list.length} files…` : `Uploading ${f.name}…`);
      try {
        let r;
        const from = opts.origin ? {origin: opts.origin, untrusted: true} : {};
        try { r = await assets.upload(f, Object.assign({type, courseId: opts.courseId || "", folderId: opts.folderId || "other"}, from)); }
        catch(e) { if (e && e.code === "store_unavailable") { await sleep(1200); r = await assets.upload(f, Object.assign({type}, from)); } else throw e; }
        const file = normFile(Object.assign({id: uid(), name: f.name, courseId: opts.courseId || "", folderId: opts.folderId || "other", kind: "file",
          revs: [Object.assign({assetId: r.id, size: r.sizeBytes, type: r.contentType, at: Date.now(), name: f.name}, r.localRel ? {localRel: r.localRel} : {})], taskIds: opts.taskId ? [opts.taskId] : [], created: Date.now()}, opts.ftype ? {ftype: opts.ftype} : {}));
        made.push(file);
        invs.push(applyChanges([{kind: "file", id: file.id, after: file}], ""));
      } catch(e) {
        const code = e && e.code;
        toast(code === "too_large" ? `${f.name} is too large to store` : code === "unsupported_type" ? `${f.name}: this file type can't be stored` : code === "quota_or_state" ? "File storage is full. Delete some files first." : code === "invalid_request" && type.startsWith("text/") ? `${f.name} isn't saved as UTF-8 text` : code === "rate_limited" ? "Too many uploads at once. Wait a moment and try again." : `Couldn't upload ${f.name}. Try again.`);
      }
    }
  };
  await Promise.all(Array.from({length: Math.min(3, list.length)}, worker));
  const skipMsg = skipped.length ? `${skipped.length === 1 ? skipped[0] + " wasn't" : skipped.length + " files weren't"} uploaded: Word, PowerPoint and Excel files can't be stored here. Save a PDF copy, or use Add Link for the file in OneDrive, Google Drive or Canvas.` : "";
  if (made.length) {
    toast((made.length === 1 ? `Uploaded ${made[0].name}.` : `Uploaded ${made.length} files.`) + (skipMsg ? " " + skipMsg : ""), () => { invs.slice().reverse().forEach(inv => applyChanges(inv, null)); cleanupAssets(made.flatMap(f => f.revs.map(r => r.assetId))); toast("Undone"); });
  } else if (skipMsg) toast(skipMsg);
  return made;
}
function cleanupAssets(ids, delay = 0){
  setTimeout(async () => {
    if (typeof sbUser !== "undefined" && sbUser && !cloud.on) { cleanupAssets(ids, 30000); return; }
    const a = await getAssets(); if (!a) return;
    const used = new Set(Object.values(state.files).flatMap(f => f.revs.map(r => r.assetId)));
    trashList().forEach(e => e.items.forEach(i => { if (i.kind === "file") (i.data.revs || []).forEach(r => used.add(r.assetId)); }));
    for (const id of ids) if (id && !used.has(id)) { try { await a.delete(id); } catch(e) {} }
  }, delay);
}
async function downloadFile(f, revIndex){
  const r = f.revs[revIndex == null ? f.revs.length - 1 : revIndex]; if (!r) return;
  let name = f.name;
  if (revIndex != null && revIndex !== f.revs.length - 1) name = name.replace(/(\.[^.]+)?$/, ` (Rev ${revLetter(revIndex)})$1`);
  if (DESK) { try { saveBlob(name, new Blob([await assetBytes(r.assetId)], {type: r.type || "application/octet-stream"})); } catch(e) { toast(navigator.onLine === false ? "You're offline and this file isn't on this computer yet" : "Couldn't get the file. Try again."); } return; }
  if (!inPreview()) {
    if (!sbActive()) { toast("Sign in to download stored files"); return; }
    let data = null; try { data = await sbDownload(r.assetId); } catch (e) {}
    if (!data) { toast("Couldn't download the file. Check your connection."); return; }
    saveBlob(name, data); return;
  }
  const dl = caps.downloads || await useCap("downloads");
  try {
    if (!dl) throw {code: "unavailable"};
    const res = await fetch("/_blob/" + r.assetId);
    if (!res.ok) throw new Error("fetch " + res.status);
    const blob = await res.blob();
    await dl.save({filename: name, data: blob});
  } catch(e) {
    if (e && e.code === "declined") return;
    window.open("/_blob/" + r.assetId, "_blank", "noopener");
  }
}
function filesVisible(){
  const q = ui.q.trim().toLowerCase();
  return Object.values(state.files).filter(f => {
    if (f.folderId === "lectures") return false;
    if (ui.fCourse !== "all" && (f.courseId || "") !== ui.fCourse) return false;
    if (ui.fCourse !== "all" && ui.fFolder && f.folderId !== ui.fFolder) return false;
    if (q) { const c = courseOf(f.courseId); const hay = [f.name, f.desc, c && c.name, c && c.code, f.url].join(" ").toLowerCase(); if (!q.split(/\s+/).every(w => hay.includes(w))) return false; }
    return true;
  }).sort((a, b) => ui.fSort === "name" ? a.name.localeCompare(b.name) : ((b.updated || b.created || 0) - (a.updated || a.created || 0)));
}
function fileRow(f){
  const r = curRev(f), c = courseOf(f.courseId);
  const tasks = f.taskIds.map(id => state.tasks[id]).filter(Boolean);
  const meta = [];
  if (ui.fCourse === "all") meta.push(`<span class="tag" style="--c:${esc(colorOf(f.courseId))};color:color-mix(in srgb,var(--c) 70%,var(--ink))">${esc(c ? courseLabel(c) : "General")}</span>`);
  if (f.kind === "cloud") { meta.push(`<span class="f-cloud">${CLOUD_SVG}${esc(CLOUD_NAMES[f.cloud.p])}</span>`); if (f.cloud.size) meta.push(`<span>${fmtSize(f.cloud.size)}</span>`); }
  else if (f.kind === "file") { meta.push(`<span>Rev ${revLetter(f.revs.length - 1)}</span>`); if (r) meta.push(`<span>${fmtSize(r.size)}</span>`); }
  else { try { meta.push(`<span>${esc(new URL(safeUrl(f.url)).hostname.replace(/^www\./, ""))}</span>`); } catch(e) {} }
  meta.push(`<span>${esc(new Date(f.updated || f.created || Date.now()).toLocaleDateString(undefined, {month:"short", day:"numeric"}))}</span>`);
  const read = f.kind === "file" && window.SBPRO && SBPRO.canRead && SBPRO.canRead(f);
  return `<li class="frow" draggable="true" data-fid="${esc(f.id)}">
    ${fileIcon(f)}
    <button class="fmain" data-act="${read ? "pdr-open" : "f-open"}" data-id="${esc(f.id)}"${read ? ` aria-label="Read ${esc(f.name)}"` : ""}><span class="fname">${esc(f.name)}</span><span class="task-meta">${meta.join("")}</span>
      ${tasks.length ? `<span class="ftasks">${tasks.slice(0, 3).map(t => `<span class="dep-chip" style="--c:${esc(colorOf(t.courseId))}">${CLIP}${esc(t.title)}</span>`).join("")}${tasks.length > 3 ? `<span class="mini">+${tasks.length - 3}</span>` : ""}</span>` : ""}</button>
    ${f.summary && !inPreview() ? `<button type="button" class="btn small ai-btn f-sum" data-act="f-summarize" data-id="${esc(f.id)}" aria-label="Summary of ${esc(f.name)}">${AI_ICON}<span class="f-sum-l">Summary</span></button>` : ""}${read ? `<button type="button" class="btn small f-edit" data-act="f-open" data-id="${esc(f.id)}" aria-label="Edit details of ${esc(f.name)}" title="Name, course, folder and versions">Edit</button>` : `<a class="btn small" href="${esc(fileHref(f))}" ${fileAttr(f)} target="_blank" rel="noopener noreferrer">Open</a>`}
  </li>`;
}
function viewFiles(){
  const cs = coursesArr();
  const all = Object.values(state.files);
  const count = (cid, fid) => all.filter(f => (f.courseId || "") === cid && (!fid || f.folderId === fid)).length;
  const node = (cid, name, color) => {
    const open = ui.fCourse === cid;
    const folders = open ? foldersOf(cid).map(fo => `<button class="fnode sub ${ui.fFolder === fo.id ? "on" : ""}" data-act="f-nav" data-c="${esc(cid)}" data-f="${esc(fo.id)}" data-drop="${esc(cid)}|${esc(fo.id)}">${FOLDER}<span>${esc(fo.name)}</span><span class="n">${count(cid, fo.id) || ""}</span></button>`).join("") : "";
    const cc = cid ? courseOf(cid) : null;
    return `<div class="fgroup"><button class="fnode ${open && !ui.fFolder ? "on" : ""}" data-act="f-nav" data-c="${esc(cid)}" data-f="" data-drop="${esc(cid)}|other" style="--c:${esc(color)}"><span class="fn-ring" aria-hidden="true">${cc ? courseRingHtml(cc) : GENERAL_ICON}</span><span class="fn-name">${esc(name)}</span><span class="n">${count(cid) || ""}</span></button>${folders}</div>`;
  };
  const tree = `<nav class="ftree" aria-label="Folders">
    <button class="fnode ${ui.fCourse === "all" ? "on" : ""}" data-act="f-nav" data-c="all" data-f="" style="--c:var(--accent-band,var(--accent))"><span class="fn-ring fn-all" aria-hidden="true">${FOLDER}</span><span class="fn-name">All Files</span><span class="n">${all.length || ""}</span></button>
    ${cs.map(c => node(c.id, courseLabel(c), c.color)).join("")}
    ${node("", "General", "#8A94A6")}
  </nav>`;
  const c = ui.fCourse !== "all" ? courseOf(ui.fCourse) : null;
  const folder = ui.fCourse !== "all" && ui.fFolder ? foldersOf(ui.fCourse).find(fo => fo.id === ui.fFolder) : null;
  const crumbs = ui.fCourse === "all" ? "All Files" : `${esc(c ? c.name : "General")}${folder ? ` <span class="mini">›</span> ${esc(folder.name)}` : ""}`;
  const fs = filesVisible();
  let list;
  if (!fs.length) {
    const none = !ui.q.trim();
    list = `<div class="empty${none ? " sb-es" : ""}" style="margin-top:12px">${none ? emptyArt() : ""}<strong>${none ? "No Files Here Yet" : "No Files Match Your Search"}</strong>${none ? (sbActive() ? "Upload any file, like PDFs, Word documents, slides or images, or drop them here." : `Upload PDFs, images or text files${caps.assets ? ", or drop them here" : ""}. For Word, PowerPoint or Excel files, save a PDF copy or add a link to the file online.`) : ""}${none ? `<div class="row-actions es-ph"><button type="button" class="btn primary" data-act="fab-file">Add a File</button></div>` : ""}</div>`;
  } else if (ui.fCourse !== "all" && !ui.fFolder) {
    list = foldersOf(ui.fCourse).map(fo => { const g = fs.filter(f => f.folderId === fo.id); return g.length ? `<h3 class="fsec">${FOLDER}${esc(fo.name)}<span class="n">${g.length}</span></h3><ul class="flist">${g.map(fileRow).join("")}</ul>` : ""; }).join("")
      + (() => { const known = new Set(foldersOf(ui.fCourse).map(fo => fo.id)); const g = fs.filter(f => !known.has(f.folderId)); return g.length ? `<h3 class="fsec">${FOLDER}Unsorted<span class="n">${g.length}</span></h3><ul class="flist">${g.map(fileRow).join("")}</ul>` : ""; })();
  } else list = `<ul class="flist">${fs.map(fileRow).join("")}</ul>`;
  const canUpload = !!caps.assets;
  const hcol = c ? c.color : ui.fCourse === "all" ? "var(--accent-band,var(--accent))" : "#8A94A6";
  const nHere = fs.length, bandActs = [ui.fCourse !== "all" ? `<button class="btn small" data-act="f-newfolder">New Folder</button>` : "", folder ? `<button class="btn small" data-act="f-folder-edit">Edit Folder</button>` : "", ui.fCourse !== "all" && !inPreview() ? `<button class="btn small ai-btn" data-act="ask-course" data-id="${esc(ui.fCourse)}">${AI_ICON} Ask ${aiWho() ? esc(aiWho()) + " " : ""}About These Files</button>` : ""].filter(Boolean).join("");
  const fhead = `<div class="fhead g2-head" style="--c:${esc(hcol)}">
      <div class="g2-band"><span class="g2-kick">${c ? esc(courseLabel(c)) + " · " : ""}Files</span>${bandActs ? `<div class="row-actions">${bandActs}</div>` : ""}</div>
      <div class="g2-low"><span class="g2-ring" aria-hidden="true">${c ? courseRingHtml(c) : ui.fCourse === "all" ? FOLDER : GENERAL_ICON}</span>
        <div class="g2-txt"><h2 class="fcrumb">${crumbs}</h2><div class="g2-meta"><span>${nHere} ${nHere === 1 ? "item" : "items"}${ui.q.trim() ? " matching your search" : ""}</span></div></div></div>
    </div>`;
  const actions = `${window.SBCLOUD ? SBCLOUD.filesBtn() : ""}${trashBtn("file")}<div class="segb" role="group" aria-label="Sort"><button data-act="f-sort" data-id="date" aria-pressed="${ui.fSort !== "name"}">Newest</button><button data-act="f-sort" data-id="name" aria-pressed="${ui.fSort === "name"}">Name</button></div>`;
  return `<div class="tl-controls f-title"><h2>Files</h2>${actions}</div>${searchNote()}
    <div class="fwrap">${tree}
      <section class="fpane" id="fpane" aria-label="Files in ${esc(ui.fCourse === "all" ? "all folders" : (c ? c.name : "General"))}">
        ${fhead}${list}
        <p class="hint-line" id="fmeter">${canUpload ? `<span class="tip-everyday">Drop files here to upload. On a computer, drag a file onto a folder to move it, or open it and pick a new folder.</span>` : (!inPreview() && (sbConfig() || SBGUEST.is()) ? "Sign in or create a free account to upload files. You can still add links." : "File uploads aren't available in this view. You can still add links.")} ${sbActive() ? "Any file type can be uploaded, up to 50 MB each." : "PDFs, images, videos and text files can be uploaded, up to 20 MB each."}</p>
      </section></div>
    <input type="file" id="fUploadIn" multiple class="sr" tabindex="-1" aria-label="Choose files to upload">`;
}
function uploadTarget(){
  const cid = ui.fCourse === "all" ? "" : ui.fCourse;
  return {courseId: cid, folderId: ui.fFolder || (ui.fCourse === "all" ? "other" : "other")};
}
function folderSelectHtml(cid, sel){ return foldersOf(cid).map(fo => `<option value="${esc(fo.id)}" ${fo.id === sel ? "selected" : ""}>${esc(fo.name)}</option>`).join(""); }
function courseSelectHtml(sel){ return `<option value="">General (no course)</option>` + coursesArr().map(c => `<option value="${esc(c.id)}" ${c.id === sel ? "selected" : ""}>${esc(c.name)}</option>`).join(""); }

function fileSheet(f){
  f = clone(f);
  let taskIds = f.taskIds.filter(id => state.tasks[id]);
  const isLink = f.kind === "link" || f.kind === "cloud", isCloud = f.kind === "cloud";
  openSheet(`<form class="sheet">${head(isCloud ? CLOUD_NAMES[f.cloud.p] + " File" : isLink ? "Link" : "File")}
    <div class="sheet-body">
      <label class="f"><span class="lh">Name ${REQ}</span><input type="text" name="name" required maxlength="200" value="${esc(f.name)}"></label>
      ${isCloud ? (window.SBCLOUD ? SBCLOUD.infoHtml(f) : "") : isLink ? `<label class="f">Web Address<input type="url" name="url" value="${esc(f.url)}" placeholder="https://…"></label>` : ""}
      <div class="two">
        <label class="f">Course<select name="courseId" id="fsCourse">${courseSelectHtml(f.courseId)}</select></label>
        <label class="f">Folder<select name="folderId" id="fsFolder">${folderSelectHtml(f.courseId, f.folderId)}</select></label>
      </div>
      <label class="f">Description<textarea name="desc" maxlength="2000" placeholder="What this is, where it came from…">${esc(f.desc)}</textarea></label>
      <fieldset><legend>Attached to Tasks</legend><div class="dep-list" id="fsTasks"></div><select id="fsTaskAdd" aria-label="Attach to a task"></select></fieldset>
      ${isLink ? "" : `<fieldset><legend>Revisions</legend><ul class="revs">${f.revs.map((r, i) => ({r, i})).reverse().map(({r, i}) => `<li><span class="rev">Rev ${revLetter(i)}</span><span class="mini">${esc(new Date(r.at).toLocaleString(undefined, {month:"short", day:"numeric", hour:"numeric", minute:"2-digit"}))}, ${fmtSize(r.size)}${r.name && r.name !== f.name ? ", " + esc(r.name) : ""}</span><span class="spacer"></span><a class="link-btn" href="${esc(assetHref(r.assetId))}" ${assetAttr(r.assetId)} target="_blank" rel="noopener noreferrer">Open</a><button type="button" class="link-btn" data-dl="${i}">Download</button></li>`).join("")}</ul>
        ${caps.assets ? `<button type="button" class="btn small" id="fsNewRev">Upload a New Revision</button><input type="file" id="fsRevIn" class="sr" tabindex="-1">` : ""}${window.SBCLOUD ? SBCLOUD.moveHtml(f) : ""}</fieldset>`}
    </div>
    <div class="sheet-foot"><button type="button" class="btn danger" id="fsDel">Delete</button><span class="spacer"></span>${(!isLink || isCloud) && !inPreview() && readableFile(f) ? `<button type="button" class="btn ai-btn" data-act="f-summarize" data-id="${esc(f.id)}">${AI_ICON} ${f.summary ? "Summary" : "Summarize"}</button>` : ""}${!isLink && window.SBPRO && SBPRO.fileBtns ? SBPRO.fileBtns(f) : ""}<a class="btn" href="${esc(fileHref(f))}" ${fileAttr(f)} target="_blank" rel="noopener noreferrer">${!isLink && window.SBPRO && SBPRO.canRead && SBPRO.canRead(f) ? (DESK ? "Open in Another App" : "Open in Browser") : "Open"}</a><button type="button" class="btn primary" data-submit>Save</button></div>
  </form>`, fd => {
    const name = String(fd.get("name") || "").trim(); if (!name) return false;
    const cur = state.files[f.id]; if (!cur) return;
    const n = Object.assign(clone(cur), {name, courseId: fd.get("courseId") || "", folderId: fd.get("folderId") || "other", desc: String(fd.get("desc") || ""), taskIds: taskIds.slice(), updated: Date.now()});
    if (isLink && !isCloud) { const u = safeUrl(fd.get("url")); if (!u) { toast("Enter a valid web address"); return false; } n.url = u; }
    if (isCloud && n.cloud && (n.courseId !== (cur.courseId || "") || n.folderId !== cur.folderId)) n.cloud = Object.assign({}, n.cloud, {pin: true});
    applyChanges([{kind:"file", id: f.id, after: n}], "File saved");
  });
  const cSel = $("#fsCourse"), fSel = $("#fsFolder");
  cSel.addEventListener("change", () => { fSel.innerHTML = folderSelectHtml(cSel.value, fSel.value); });
  const tBox = $("#fsTasks"), tAdd = $("#fsTaskAdd");
  const drawT = () => {
    tBox.innerHTML = taskIds.map(id => { const t = state.tasks[id]; return t ? `<span class="dep-chip" style="--c:${esc(colorOf(t.courseId))}">${esc(t.title)}<button type="button" class="x-btn" data-t-rm="${esc(id)}" aria-label="Detach from ${esc(t.title)}">${CLOSE}</button></span>` : ""; }).join("") || `<span class="mini">Not attached to any task.</span>`;
    const cid = cSel.value;
    const cands = tasksArr().filter(t => !taskIds.includes(t.id)).sort(sortTasks);
    const grp = (label, arr) => arr.length ? `<optgroup label="${esc(label)}">${arr.map(t => `<option value="${esc(t.id)}">${esc(t.title)}${t.due ? " (" + esc(fmtShort(t.due)) + ")" : ""}</option>`).join("")}</optgroup>` : "";
    tAdd.innerHTML = `<option value="">Attach to a task…</option>` + grp("This course", cands.filter(t => (t.courseId || "") === cid)) + grp("Other courses", cands.filter(t => (t.courseId || "") !== cid));
  };
  tAdd.addEventListener("change", () => { if (tAdd.value) { taskIds.push(tAdd.value); drawT(); } });
  tBox.addEventListener("click", e => { const b = e.target.closest("[data-t-rm]"); if (b) { taskIds = taskIds.filter(x => x !== b.dataset.tRm); drawT(); } });
  cSel.addEventListener("change", drawT);
  drawT();
  $$("[data-dl]", dlg).forEach(b => b.addEventListener("click", () => downloadFile(state.files[f.id] || f, Number(b.dataset.dl))));
  const nr = $("#fsNewRev");
  if (nr) {
    nr.addEventListener("click", () => $("#fsRevIn").click());
    $("#fsRevIn").addEventListener("change", async e => {
      const file = e.target.files && e.target.files[0]; e.target.value = ""; if (!file) return;
      const type = mimeFor(file) || (sbActive() ? (file.type || "application/octet-stream") : null);
      if (!type) { toast("That file type can't be stored. Save it as PDF first."); return; }
      const a = await getAssets(); if (!a) return;
      toast(`Uploading ${file.name}…`);
      try {
        const cur0 = state.files[f.id] || f;
        const r = await a.upload(file, {type, courseId: cur0.courseId, folderId: cur0.folderId});
        const cur = state.files[f.id]; if (!cur) return;
        const n = clone(cur); n.revs = n.revs.concat(Object.assign({assetId: r.id, size: r.sizeBytes, type: r.contentType, at: Date.now(), name: file.name}, r.localRel ? {localRel: r.localRel} : {})); n.updated = Date.now();
        dlg.close();
        applyChanges([{kind:"file", id: f.id, after: n}], `${n.name}: Rev ${revLetter(n.revs.length - 1)} uploaded`);
      } catch(err) { toast(err && err.code === "too_large" ? "That file is too large" : err && err.code === "quota_or_state" ? "File storage is full" : "Couldn't upload the new revision"); }
    });
  }
  if (isCloud) $("#fsDel").textContent = "Remove";
  $("#fsDel").addEventListener("click", () => {
    const cur = state.files[f.id]; if (!cur) return;
    dlg.close();
    if (cur.kind === "cloud" && window.SBCLOUD) { SBCLOUD.remove(cur); return; }
    applyChanges([{kind:"file", id: f.id, after: null}], `Deleted ${cur.name}`);
  });
}
function linkSheet(){
  const tgt = uploadTarget();
  openSheet(`<form class="sheet">${head("Add a Link")}
    <div class="sheet-body">
      <p class="mini" style="margin:0">Use links for files kept elsewhere, like Word documents in OneDrive or Google Drive, or pages on Canvas.</p>
      ${REQ_NOTE}<label class="f"><span class="lh">Web Address ${REQ}</span><input type="url" name="url" required placeholder="https://…" autofocus></label>
      <label class="f">Name<input type="text" name="name" maxlength="200" placeholder="e.g. Lab 3 template (Word)"></label>
      <div class="two">
        <label class="f">Course<select name="courseId" id="lkCourse">${courseSelectHtml(tgt.courseId)}</select></label>
        <label class="f">Folder<select name="folderId" id="lkFolder">${folderSelectHtml(tgt.courseId, tgt.folderId)}</select></label>
      </div>
    </div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>Add Link</button></div>
  </form>`, fd => {
    const u = safeUrl(fd.get("url")); if (!u) { toast("Enter a valid web address"); return false; }
    let name = String(fd.get("name") || "").trim();
    if (!name) { try { const x = new URL(u); name = x.hostname.replace(/^www\./, "") + (x.pathname.length > 1 ? decodeURIComponent(x.pathname).split("/").filter(Boolean).pop().slice(0, 60) : ""); } catch(e) { name = u; } }
    const f = normFile({id: uid(), name, kind: "link", url: u, courseId: fd.get("courseId") || "", folderId: fd.get("folderId") || "other", created: Date.now()});
    applyChanges([{kind:"file", id: f.id, after: f}], `Added ${name}`);
  });
  $("#lkCourse").addEventListener("change", e => { $("#lkFolder").innerHTML = folderSelectHtml(e.target.value, "other"); });
}
function folderSheet(existing){
  const cid = ui.fCourse === "all" ? "" : ui.fCourse;
  const folders = foldersOf(cid);
  const n = existing ? Object.values(state.files).filter(f => (f.courseId || "") === cid && f.folderId === existing.id).length : 0;
  openSheet(`<form class="sheet">${head(existing ? "Folder" : "New Folder")}
    <div class="sheet-body">${REQ_NOTE}<label class="f"><span class="lh">Folder Name ${REQ}</span><input type="text" name="name" required maxlength="60" value="${esc(existing ? existing.name : "")}" autofocus placeholder="e.g. Lab reports"></label>
    ${existing && existing.id !== "other" ? `<p class="mini" style="margin:0">Deleting this folder moves its ${n} file${n === 1 ? "" : "s"} to Other.</p>` : ""}</div>
    <div class="sheet-foot">${existing && existing.id !== "other" ? `<button type="button" class="btn danger" id="fdDel">Delete Folder</button>` : ""}<span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>${existing ? "Save" : "Create Folder"}</button></div>
  </form>`, fd => {
    const name = String(fd.get("name") || "").trim(); if (!name) return false;
    const next = existing ? folders.map(fo => fo.id === existing.id ? {id: fo.id, name} : fo) : folders.concat({id: uid(), name});
    saveFolders(cid, next, existing ? "Folder renamed" : `Created ${name}`);
    if (!existing) ui.fFolder = next[next.length - 1].id;
  });
  const del = $("#fdDel");
  if (del) del.addEventListener("click", () => {
    dlg.close();
    const moves = Object.values(state.files).filter(f => (f.courseId || "") === cid && f.folderId === existing.id).map(f => ({kind:"file", id: f.id, after: Object.assign(clone(f), {folderId: "other"})}));
    ui.fFolder = "";
    saveFolders(cid, folders.filter(fo => fo.id !== existing.id), `Deleted ${existing.name}`, moves);
  });
}
function saveFolders(cid, folders, label, extraChanges = []){
  if (cid) applyChanges([{kind:"course", id: cid, after: Object.assign(clone(state.courses[cid]), {folders})}].concat(extraChanges), label);
  else { state.settings = Object.assign({}, state.settings, {folders}); saveSettings(); if (extraChanges.length) applyChanges(extraChanges, label); else { scheduleRender(); toast(label); } }
}
function moveFile(fid, target){
  const f = state.files[fid]; if (!f) return;
  const [cid, folderId] = target.split("|");
  if ((f.courseId || "") === cid && f.folderId === folderId) return;
  const valid = foldersOf(cid).some(fo => fo.id === folderId) ? folderId : "other";
  const fo = foldersOf(cid).find(x => x.id === valid);
  applyChanges([{kind:"file", id: fid, after: Object.assign(clone(f), {courseId: cid, folderId: valid, updated: Date.now()})}], `Moved ${f.name} to ${fo ? fo.name : "Other"}`);
}
// Drag files between folders (mouse) and drop files from the computer to upload
document.addEventListener("dragstart", e => { const r = e.target.closest && e.target.closest(".frow"); if (r) { e.dataTransfer.setData("text/x-file-id", r.dataset.fid); e.dataTransfer.effectAllowed = "move"; } });
document.addEventListener("dragover", e => {
  if (ui.tab !== "files") return;
  const node = e.target.closest && e.target.closest("[data-drop]");
  const pane = e.target.closest && e.target.closest("#fpane");
  const types = [...(e.dataTransfer.types || [])];
  if ((node && (types.includes("text/x-file-id") || types.includes("Files"))) || (pane && types.includes("Files"))) {
    e.preventDefault();
    $$(".drop-on").forEach(x => { if (x !== (node || pane)) x.classList.remove("drop-on"); });
    (node || pane).classList.add("drop-on");
  }
});
document.addEventListener("dragleave", e => { const t = e.target.closest && e.target.closest(".drop-on"); if (t && !t.contains(e.relatedTarget)) t.classList.remove("drop-on"); });
document.addEventListener("drop", e => {
  if (ui.tab !== "files") return;
  const node = e.target.closest && e.target.closest("[data-drop]");
  const pane = e.target.closest && e.target.closest("#fpane");
  $$(".drop-on").forEach(x => x.classList.remove("drop-on"));
  if (!node && !pane) return;
  e.preventDefault();
  const fid = e.dataTransfer.getData("text/x-file-id");
  if (fid && node) { moveFile(fid, node.dataset.drop); return; }
  const list = [...(e.dataTransfer.files || [])];
  if (list.length) {
    if (node) { const [cid, folderId] = node.dataset.drop.split("|"); uploadFiles(list, {courseId: cid, folderId, cloud: true}); }
    else if (ui.fCourse === "all" && window.SBQADD && caps.assets) SBQADD.open(list);
    else uploadFiles(list, Object.assign(uploadTarget(), {cloud: true}));
  }
});

/* Sticky notes */
const NOTE_COLORS = [["yellow","#FFE680"],["pink","#FFB8CC"],["blue","#AED6FF"],["green","#BDECA8"],["orange","#FFCB8E"],["purple","#D6C6FF"]];
const NOTE_COLORS_SHOWN = NOTE_COLORS.map((c, i, a) => a[i === 0 ? 2 : i === 2 ? 0 : i]);
// A note keeps the colour you picked on every theme
const noteColor = k => NOTE_COLORS[Math.max(0, NOTE_COLORS.findIndex(c => c[0] === k))][1];
// One width on every screen
const NOTE_W = () => 200;
const TRASH = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7M6 7l1 13a1.5 1.5 0 0 0 1.5 1.4h7a1.5 1.5 0 0 0 1.5-1.4L18 7M10 11v6M14 11v6"/></svg>';
const ARCHIVE = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/><path d="M9 13h6"/></svg>';
function normNote(n){
  n = Object.assign({text:"", color:"yellow", x:40, y:40, z:1, rot:0, courseId:"", archived:false, shape:"", pin:"", stickers:[]}, n);
  if (n.shape === "taped") { n.shape = ""; n.pin = n.pin || "tape"; }
  if (!Array.isArray(n.stickers)) n.stickers = [];
  if (n.ink != null) { const k = normInk(n.ink, 2000); if (k) n.ink = k; else delete n.ink; }
  if (n.wb != null) normWbNote(n);
  if (n.photos != null) { n.photos = Array.isArray(n.photos) ? [...new Set(n.photos.filter(x => typeof x === "string" && x && x.length <= 80))].slice(0, 12) : []; if (!n.photos.length) delete n.photos; }
  const num = (v, d, lo, hi) => { const x = Number(v); return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d; };
  n.x = num(n.x, 0, 0, 1e6); n.y = num(n.y, 0, 0, 1e6);
  n.z = Math.round(num(n.z, 1, -1e9, 1e9)); n.rot = num(n.rot, 0, -3600, 3600);
  n.stickers = n.stickers.filter(x => x && typeof x === "object" && typeof x.k === "string").map(x => {
    const o = Object.assign({}, x, {x: num(x.x, 50, -1e4, 1e4)});
    if (x.r != null) o.r = num(x.r, 0, -360, 360);
    if (x.s != null) o.s = num(x.s, 1, 0.1, 10);
    if (x.yp != null) o.yp = num(x.yp, 0, -1e5, 1e5);
    if (x.y != null) o.y = num(x.y, 50, -1e4, 1e4);
    return o;
  });
  return n;
}
// Whiteboards (module 99-whiteboard) are notes too
const WB_TPLS = ["blank", "grid", "dots", "lines", "cornell", "concept", "week", "kanban", "venn", "timeline"];
function normWbNote(n){
  const w = n.wb && typeof n.wb === "object" && !Array.isArray(n.wb) ? n.wb : {};
  const o = {v: 1, tpl: WB_TPLS.includes(w.tpl) ? w.tpl : "blank"};
  if (w.g && typeof w.g === "object" && typeof w.g.gid === "string" && typeof w.g.bid === "string" && /^[\w-]{1,80}$/.test(w.g.gid) && /^[\w-]{1,80}$/.test(w.g.bid)) o.g = {gid: w.g.gid, bid: w.g.bid, seq: Math.max(0, Math.round(Number(w.g.seq)) || 0), gn: String(w.g.gn == null ? "" : w.g.gn).slice(0, 80)};
  if (Number.isFinite(Number(w.pa)) && Number(w.pa) > 0) o.pa = Math.round(Math.min(4, Math.max(0.3, Number(w.pa))) * 1000) / 1000;
  n.wb = o;
  if (n.wbInk != null) { const k = normInk(n.wbInk, 6000); if (k) n.wbInk = k; else delete n.wbInk; }
  if (n.wbItems != null) {
    const num = (v, d, lo, hi) => { const x = Number(v); return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d; };
    const seen = new Set(), out = [];
    (Array.isArray(n.wbItems) ? n.wbItems : []).forEach(it => {
      if (out.length >= 300 || !it || typeof it !== "object" || typeof it.id !== "string" || !/^[\w-]{1,40}$/.test(it.id) || seen.has(it.id)) return;
      const o2 = {id: it.id, k: it.k === "i" ? "i" : "t", x: Math.round(num(it.x, 0, -2000, 8000)), y: Math.round(num(it.y, 0, -2000, 6000)), at: Number(it.at) > 0 ? Math.round(Number(it.at)) : 0};
      if (o2.k === "t") { o2.s = String(it.s == null ? "" : it.s).slice(0, 2000); if (!o2.s.trim()) return; o2.c = typeof it.c === "string" && /^[a-z]{1,12}$/.test(it.c) ? it.c : "ink"; o2.f = Math.round(num(it.f, 46, 10, 400)); if (["neat", "quick", "hand", "fun"].includes(it.ff)) o2.ff = it.ff; }
      else {
        o2.w = Math.round(num(it.w, 400, 8, 8000)); o2.h = Math.round(num(it.h, 300, 8, 6000));
        if (typeof it.f === "string" && /^[\w-]{1,80}$/.test(it.f)) o2.f = it.f;
        if (typeof it.src === "string" && it.src.length <= 400000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(it.src)) o2.src = it.src;
        if (!o2.f && !o2.src) return;
        if (it.r === 1) o2.r = 1;
        if (o2.r && typeof it.o === "string" && /^[\w-]{1,80}$/.test(it.o)) o2.o = it.o;
        if (it.fade === 1) o2.fade = 1;
        if (Array.isArray(it.er)) { const er = it.er.filter(c => Array.isArray(c) && c.length === 3 && c.every(Number.isFinite)).slice(0, 800).map(c => [Math.round(num(c[0], 0, -200, 1200)), Math.round(num(c[1], 0, -200, 1200)), Math.round(num(c[2], 1, 1, 1000))]); if (er.length) o2.er = er; }
        if (o2.r && typeof it.tint === "string" && /^[a-z]{1,12}$/.test(it.tint)) o2.tint = it.tint;
      }
      seen.add(it.id); out.push(o2);
    });
    if (out.length) n.wbItems = out; else delete n.wbItems;
  }
}
const isWhiteboard = n => !!(n && n.wb);
const notesArr = () => Object.values(state.notes || {}).filter(n => !isWhiteboard(n));
const NOTE_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px;margin-right:2px"><path d="M4 4h16v10l-6 6H4z"/><path d="M14 20v-6h6"/></svg>';
const ROT_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>';
const notesOfTask = id => notesArr().filter(n => n.taskId === id);
let noteEditing = null, noteMoreOpen = null;
document.addEventListener("toggle", e => { const d = e.target; if (d && d.classList && d.classList.contains("note-moredd")) { const el = d.closest(".note"); noteMoreOpen = d.open && el ? el.dataset.note : null; } }, true);
function noteMatches(n){
  const q = ui.q.trim().toLowerCase(); if (!q) return true;
  const c = courseOf(n.courseId);
  const hay = [n.text, c && c.name, c && c.code].join(" ").toLowerCase();
  return q.split(/\s+/).every(w => hay.includes(w));
}
function noteTaskOpts(n){
  const cur = n.taskId && state.tasks[n.taskId];
  const cands = tasksArr().filter(t => t.status !== "done" && t.id !== n.taskId).sort(sortTasks);
  const grp = (label, arr) => arr.length ? `<optgroup label="${esc(label)}">${arr.map(t => `<option value="${esc(t.id)}">${esc(t.title)}${t.due ? " (" + esc(fmtShort(t.due)) + ")" : ""}</option>`).join("")}</optgroup>` : "";
  return `<option value="">No task attached</option>${cur ? `<option value="${esc(cur.id)}" selected>Attached: ${esc(cur.title)}</option>` : ""}`
    + grp(n.courseId && courseOf(n.courseId) ? courseLabel(courseOf(n.courseId)) : "Open tasks", cands.filter(t => !n.courseId || t.courseId === n.courseId))
    + (n.courseId ? grp("Other courses", cands.filter(t => t.courseId !== n.courseId)) : "");
}
function noteHtml(n){
  const c = courseOf(n.courseId), w = NOTE_W(), tk = n.taskId ? state.tasks[n.taskId] : null;
  const editing = noteEditing === n.id;
  const dim = !noteMatches(n);
  const body = editing
    ? `<textarea class="note-text" id="noteText" maxlength="8000" aria-label="Note text" placeholder="Write a note…">${esc(n.text)}</textarea>${window.SBPRO && SBPRO.noteExtra ? SBPRO.noteExtra(n) : ""}
       <div class="note-tools">
         <div class="note-colors" role="group" aria-label="Note color">${NOTE_COLORS_SHOWN.map(([k, hex]) => `<button type="button" class="nc ${k === n.color ? "on" : ""}" style="background:${noteColor(k)}" data-act="note-color" data-id="${esc(n.id)}" data-color="${k}" aria-label="${k}"></button>`).join("")}</div>
         <select class="note-task" data-id="${esc(n.id)}" aria-label="Attach to a task">${noteTaskOpts(n)}</select>
         <select class="note-course" data-id="${esc(n.id)}" aria-label="Course">${`<option value="">No course</option>` + coursesArr().map(x => `<option value="${esc(x.id)}" ${x.id === n.courseId ? "selected" : ""}>${esc(courseLabel(x))}</option>`).join("")}</select>
         ${window.SBPRO && SBPRO.noteBar ? SBPRO.noteBar(n) : ""}
         <div class="note-hbtns" role="group" aria-label="Undo and redo"><button type="button" class="btn small" data-act="note-undo" title="Undo your last change (Ctrl+Z also works)" aria-label="Undo change">↶ Undo</button><button type="button" class="btn small" data-act="note-redo" title="Redo" aria-label="Redo change">↷ Redo</button></div>
         <details class="note-moredd"${noteMoreOpen === n.id ? " open" : ""}><summary class="btn small">More<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></summary><div class="note-row2"><select class="note-shape" data-id="${esc(n.id)}" aria-label="Note shape" title="Shape"><option value="">${esc((NOTE_SHAPES.find(x => x.id === styleCfg().note) || NOTE_SHAPES[0]).name)} (default)</option>${NOTE_SHAPES.filter(x => x.id !== (NOTE_SHAPES.find(y => y.id === styleCfg().note) || NOTE_SHAPES[0]).id).map(x => `<option value="${x.id}" ${n.shape === x.id ? "selected" : ""} ${owns("note", x.id) ? "" : "disabled"}>${esc(x.name)}${x.tier === "pro" ? " ✦" : ""}</option>`).join("")}</select><select class="note-pin" data-id="${esc(n.id)}" aria-label="Pin" title="Pin">${pinOptionsHtml(n)}</select></div><div class="note-xbtns" role="group" aria-label="More for this note"><button type="button" class="btn small" data-act="note-versions" data-id="${esc(n.id)}" title="Restore an earlier version of this note">Versions</button><button type="button" class="btn small" data-act="note-export" data-id="${esc(n.id)}" title="Make a Word or Google Doc from this note">Export</button>${window.SBSHARE ? `<button type="button" class="btn small" data-act="share-link" data-kind="note" data-ref="${esc(n.id)}" title="Make a link anyone can open">Share Link</button>` : ""}</div></details>
         <div class="note-btns"><button type="button" class="nb" data-act="note-archive" data-id="${esc(n.id)}" title="Archive" aria-label="Archive note">${ARCHIVE}</button><button type="button" class="nb" data-act="note-trash" data-id="${esc(n.id)}" title="Delete" aria-label="Delete note">${TRASH}</button><button type="button" class="btn small" data-act="note-done">Done</button></div>
       </div>`
    : `<div class="note-body">${n.text.trim() ? (window.SBPRO && SBPRO.noteText ? SBPRO.noteText(n) : esc(n.text)) : `<span class="note-empty">Empty note. Tap to write.</span>`}</div>`;
  return `<div class="note ns-${noteShapeOf(n)} ${editing ? "editing" : ""} ${dim ? "dim" : ""}" data-note="${esc(n.id)}" tabindex="${editing ? -1 : 0}" role="${editing ? "group" : "button"}" aria-label="${editing ? "Editing note" : "Note: " + esc(n.text.slice(0, 60) || "empty") + ". Press Enter to edit."}"
    style="left:${n.x}px;top:${n.y}px;z-index:${editing ? 9000 : n.z};width:${w}px;--nc:${noteColor(n.color)};--rot:${editing ? 0 : n.rot}deg">
    ${pinHtml(notePinOf(n))}
    ${editing ? "" : `<span class="note-rot" data-rot="${esc(n.id)}" title="Drag to rotate" aria-hidden="true">${ROT_ICON}</span>`}
    ${noteStickersHtml(n, editing)}
    ${c ? `<span class="note-tag" style="--c:${esc(c.color)}">${esc(courseLabel(c))}</span>` : ""}
    ${n.conflict ? `<button type="button" class="note-conflict" data-act="note-resolve" data-id="${esc(n.id)}">Edited on two devices. Tap to review.</button>` : ""}
    ${tk ? `<button type="button" class="note-task-tag" data-act="edit-task" data-id="${esc(tk.id)}" title="Open ${esc(tk.title)}">${CLIP}${esc(tk.title)}</button>` : ""}
    ${body}
    ${!editing && n.photos && window.SBPRO && SBPRO.notePhotos ? SBPRO.notePhotos(n) : ""}
    ${!editing && n.ink && window.SBINK ? SBINK.noteThumb(n) : ""}
  </div>`;
}

// Notes never show a scrollbar
const NOTE_OPEN = new Set();
function noteFitText(t){ if (!t) return; const h = t.offsetHeight; t.style.height = "auto"; t.style.height = (t.scrollHeight + 2) + "px"; if (t.offsetHeight !== h) fitNoteBoard(); }
function noteClipCheck(){
  $$(".note[data-note]:not(.editing)").forEach(el => {
    const b = el.querySelector(".note-body"); if (!b) return;
    const id = el.dataset.note, open = NOTE_OPEN.has(id);
    el.classList.toggle("nb-open", open);
    const long = open || b.scrollHeight > b.clientHeight + 2;
    el.classList.toggle("nb-clip", long);
    let m = el.querySelector(".note-more");
    if (long && !m) { m = document.createElement("button"); m.type = "button"; m.className = "note-more"; b.after(m); }
    if (!long && m) m.remove();
    if (m) { m.innerHTML = (open ? "Show Less" : "Show More") + ` <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`; m.setAttribute("aria-expanded", open ? "true" : "false"); }
  });
}
// The note being edited: a sheet over the page on a phone, and scrolled fully into view on a bigger screen
const notePhone = () => !!(window.matchMedia && matchMedia("(max-width:700px)").matches);
let noteShown = null, noteSheetId = null;
function noteSheetUp(){
  const el = $(".note.editing"), sheet = !!el && notePhone();
  if (!el) noteMoreOpen = null;
  let bg = $(".n-sheet-bg");
  if (sheet && !bg) { bg = document.createElement("div"); bg.className = "n-sheet-bg"; bg.setAttribute("aria-hidden", "true"); if (bg.showPopover) bg.setAttribute("popover", "manual"); document.body.appendChild(bg); }
  if (bg) { bg.classList.toggle("on", sheet); if (bg.showPopover) try { if (sheet && !bg.matches(":popover-open")) bg.showPopover(); else if (!sheet && bg.matches(":popover-open")) bg.hidePopover(); } catch (e) {} }
  if (!sheet) { noteSheetId = null; noteSheetAway(); return; }
  el.classList.add("n-sheet");
  // slides up once when a note opens, not again on every redraw while it's being edited
  if (noteSheetId !== el.dataset.note) { noteSheetId = el.dataset.note; el.classList.add("n-enter"); if (bg) { bg.classList.remove("n-enter"); void bg.offsetWidth; bg.classList.add("n-enter"); } setTimeout(() => { el.classList.remove("n-enter"); if (bg) bg.classList.remove("n-enter"); }, 500); }
  if (el.showPopover && !el.matches(":popover-open")) {
    const t = $("#noteText"), had = t && document.activeElement === t;
    el.setAttribute("popover", "manual");
    try { el.showPopover(); } catch (e) {}
    if (had && document.activeElement !== t) try { t.focus({preventScroll: true}); } catch (e) {}
    noteToastUp(true);
  }
  noteKbFit(); noteSheetKeep(el);
}
// Closing a note on a phone: the editor slides back down like the other sheets, instead of vanishing (a still copy does the
// sliding; the note itself is already saved and closed)
let noteSheetLast = null;
function noteSheetKeep(el){ try { const r = el.getBoundingClientRect(); if (r.height > 40) noteSheetLast = {el, r}; } catch (e) {} }
function noteSheetAway(){
  const L = noteSheetLast; noteSheetLast = null;
  if (!L || L.el.isConnected || !document.body.showPopover) return;
  const still = document.documentElement.dataset.motion === "static" || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (still || L.r.top >= innerHeight) return;
  const host = document.createElement("div"); host.className = "n-ghost sm-skip"; host.setAttribute("aria-hidden", "true"); host.inert = true; host.setAttribute("popover", "manual");
  host.innerHTML = `<div class="n-ghost-dim"></div>`;
  const c = L.el.cloneNode(true); c.removeAttribute("popover"); c.querySelectorAll("[id]").forEach(e => e.removeAttribute("id")); c.classList.remove("n-enter");
  const t = L.el.querySelector(".note-text"), t2 = c.querySelector(".note-text"); if (t && t2) t2.value = t.value;
  [["inset", `${L.r.top}px auto auto ${L.r.left}px`], ["width", L.r.width + "px"], ["height", L.r.height + "px"], ["max-height", "none"], ["animation", "none"]].forEach(([k, v]) => c.style.setProperty(k, v, "important"));
  host.appendChild(c); document.body.appendChild(host);
  try { host.showPopover(); } catch (e) {}
  const opts = {duration: 260, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards"};
  const a = c.animate([{translate: "0 0"}, {translate: `0 ${Math.max(L.r.height, innerHeight - L.r.top) + 20}px`}], opts);
  host.firstChild.animate([{opacity: 1}, {opacity: 0}], opts);
  const done = () => host.remove(); a.finished.then(done, done); setTimeout(done, 700);
}
// A toast shows above the sheet
function noteToastUp(again){
  const t = document.getElementById("toast"); if (!t || !t.showPopover) return;
  const up = t.classList.contains("show") && !!$(".note.n-sheet:popover-open"), open = t.matches(":popover-open");
  try {
    if (open && (!up || again)) t.hidePopover();
    if (up && (!open || again)) { t.setAttribute("popover", "manual"); t.showPopover(); }
    else if (!up) t.removeAttribute("popover");
  } catch (e) {}
}
{ const t = document.getElementById("toast"); if (t) new MutationObserver(() => noteToastUp(false)).observe(t, {attributes: true, attributeFilter: ["class"]}); }
function noteKbFit(){
  const el = $(".note.n-sheet"), vv = window.visualViewport; if (!el || !vv) return;
  // the iPhone app: the bridge says how much of the app the keyboard covers while the app's frame catches up
  const nat = document.documentElement.classList.contains("kb-native") && typeof window.sbVisibleH === "function";
  const vis = nat ? window.sbVisibleH() : vv.height, kb = nat ? innerHeight - vis : Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop));
  el.style.setProperty("--kb", Math.max(0, Math.round(kb)) + "px");
  el.style.setProperty("--vvh", Math.round(vis) + "px");   // what's visible: the sheet is never taller, so it never runs off the top
  requestAnimationFrame(() => { if (el.isConnected) noteSheetKeep(el); });
}
if (window.visualViewport) { visualViewport.addEventListener("resize", noteKbFit); visualViewport.addEventListener("scroll", noteKbFit); }
addEventListener("sb-kb-cover", noteKbFit);
function noteScrollIn(){
  const el = $(".note.editing"), sc = $("#nbScroll");
  if (!el || !sc) { noteShown = null; return; }
  if (noteShown === el.dataset.note || el.classList.contains("n-sheet")) { noteShown = el.dataset.note; return; }
  noteShown = el.dataset.note;
  const er = el.getBoundingClientRect(), sr = sc.getBoundingClientRect(), pad = 12;
  let dy = er.bottom > sr.bottom - pad ? er.bottom - sr.bottom + pad : 0; if (er.top - dy < sr.top + pad) dy = er.top - sr.top - pad;
  let dx = er.right > sr.right - pad ? er.right - sr.right + pad : 0; if (er.left - dx < sr.left + pad) dx = er.left - sr.left - pad;
  if (dx || dy) sc.scrollBy(dx, dy);
  const r = sc.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) sc.scrollIntoView({block: "nearest"});
}
// Desktop: the board reaches down to the same spot as the whiteboard
function nbFill(){
  const el = document.getElementById("nbScroll");
  if (!el) return;
  if (innerWidth < 640 || boardMaxOn()) { el.style.removeProperty("height"); return; }
  const top = el.getBoundingClientRect().top + scrollY;
  el.style.setProperty("height", Math.max(380, Math.round(innerHeight - Math.min(top, innerHeight * 0.45) - 27)) + "px", "important");
}
addEventListener("resize", () => { if (ui.tab === "notes") nbFill(); });
hook("render", () => { noteSheetUp(); if (ui.tab !== "notes") return; noteFitText($("#noteText")); nbFill(); requestAnimationFrame(() => { noteFitText($("#noteText")); noteClipCheck(); fitNoteBoard(); noteScrollIn(); }); });
document.addEventListener("input", e => { if (e.target && e.target.id === "noteText") noteFitText(e.target); });
document.addEventListener("focusin", e => { if (e.target && e.target.id === "noteText") noteFitText(e.target); });
["pointerdown", "mousedown", "touchstart"].forEach(t => document.addEventListener(t, e => { if (e.target.closest && e.target.closest(".note-more")) e.stopPropagation(); }, {capture: true, passive: true}));
document.addEventListener("click", e => {
  const m = e.target.closest && e.target.closest(".note-more"); if (!m) return;
  e.stopPropagation(); e.preventDefault();
  const id = m.closest(".note").dataset.note; NOTE_OPEN.has(id) ? NOTE_OPEN.delete(id) : NOTE_OPEN.add(id); noteClipCheck(); fitNoteBoard();
}, true);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (ui.tab === "notes") noteClipCheck(); });
/* Note boards: separate boards you can switch between, named by class or anything else */
const NB_KEY = "studyboard:noteBoard";
const noteBoards = () => { const a = state.settings && state.settings.noteBoards; return Array.isArray(a) ? a.filter(b => b && b.id) : []; };
function noteBoardId(){
  let id = ui.noteBoard;
  if (id == null) { try { id = localStorage.getItem(NB_KEY) || ""; } catch (e) { id = ""; } }
  if (id && !noteBoards().some(b => b.id === id)) id = "";
  ui.noteBoard = id; return id;
}
const noteBoardOf = n => { const b = n.board || ""; return b && noteBoards().some(x => x.id === b) ? b : ""; };
const nbName = id => id ? ((noteBoards().find(b => b.id === id) || {}).name || "Board") : "My Notes";
const nbColor = b => { const c = b && b.courseId && courseOf(b.courseId); return c ? c.color : (b && b.color) || "var(--muted)"; };
function noteBoardBar(){
  const cur = noteBoardId(), live = notesArr().filter(n => !n.archived);
  const count = id => live.filter(n => noteBoardOf(n) === id).length;
  const tab = (id, name, color, n) => `<button type="button" role="tab" class="nb-tab${id === cur ? " on" : ""}" aria-selected="${id === cur}" data-act="nb-pick" data-id="${esc(id)}" data-drop-note="board:${esc(id)}" style="--c:${esc(color)}"><span class="sd"></span><span class="nb-tn">${esc(name)}</span><span class="n">${n}</span></button>${id && id === cur ? `<button type="button" class="icon-btn sm" data-act="nb-edit" data-id="${esc(cur)}" aria-label="Rename or delete this board" title="Board options">${DOTS_H}</button>` : ""}`;
  return `<div class="nb-boards" role="tablist" aria-label="Note boards">${tab("", "My Notes", "var(--muted)", count(""))}${noteBoards().map(b => tab(b.id, b.name, nbColor(b), count(b.id))).join("")}<button type="button" class="nb-tab add" data-act="nb-new" aria-label="New note board">+ New Board</button></div>`
    + `<div class="cf-row nb-row"><label class="cf-pick on" style="--c:${esc(cur ? nbColor(noteBoards().find(b => b.id === cur)) : "var(--muted)")}"><span class="dot" aria-hidden="true"></span><span class="cf-l">${esc(nbName(cur))}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
      <select data-nb-pick aria-label="Note board"><option value=""${cur ? "" : " selected"}>My Notes (${count("")})</option>${noteBoards().map(b => `<option value="${esc(b.id)}"${b.id === cur ? " selected" : ""}>${esc(b.name)} (${count(b.id)})</option>`).join("")}<option value="__new">+ New Board…</option></select></label>${cur ? `<button type="button" class="btn small nb-opts" data-act="nb-edit" data-id="${esc(cur)}" aria-label="Rename or delete this board" title="Board options">${DOTS_H}</button>` : ""}</div>`;
}
const DOTS_H = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><circle cx="5.5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="18.5" cy="12" r="1.8"/></svg>';
function noteBoardSheet(id){
  const b = id ? noteBoards().find(x => x.id === id) : null;
  if (id && !b) return;
  const used = new Set(noteBoards().map(x => x.courseId).filter(Boolean));
  openSheet(`<form class="sheet">${head(b ? "Note Board" : "New Note Board")}<div class="sheet-body">
    <label class="f"><span class="lh">Name ${REQ}</span><input type="text" name="name" required maxlength="40" value="${esc(b ? b.name : "")}" placeholder="e.g. Biology, Ideas, Group project" autofocus></label>
    <label class="f">Class<select name="courseId"><option value="">Not tied to a class</option>${coursesArr().map(c => `<option value="${esc(c.id)}" ${b && b.courseId === c.id ? "selected" : ""}>${esc(courseLabel(c))}${!b && used.has(c.id) ? " (already has a board)" : ""}</option>`).join("")}</select><span class="mini">New notes on this board are tagged with the class, and the board takes its color.</span></label>
    ${REQ_NOTE}</div>
    <div class="sheet-foot">${b ? `<button type="button" class="btn danger" data-nb-del>Delete Board</button>` : ""}<span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="submit" class="btn primary" data-submit>${b ? "Save" : "Create Board"}</button></div></form>`, fd => {
    const name = String(fd.get("name") || "").replace(/\s+/g, " ").trim().slice(0, 40); if (!name) return false;
    const courseId = fd.get("courseId") || "";
    const list = noteBoards().slice();
    if (b) { const i = list.findIndex(x => x.id === b.id); list[i] = Object.assign({}, b, {name, courseId}); }
    else { const nb = {id: uid(), name, courseId}; list.push(nb); ui.noteBoard = nb.id; try { localStorage.setItem(NB_KEY, nb.id); } catch (e) {} }
    state.settings = Object.assign({}, state.settings, {noteBoards: list}); saveSettings(); render();
  });
  const del = dlg.querySelector("[data-nb-del]");
  if (del) del.addEventListener("click", () => {
    const mine = notesArr().filter(n => n.board === b.id), live = mine.filter(n => !n.archived).length, at = noteBoards().findIndex(x => x.id === b.id);
    if (mine.length) applyChanges(mine.map(n => ({kind: "note", id: n.id, after: Object.assign(clone(n), {board: ""})})), null);
    state.settings = Object.assign({}, state.settings, {noteBoards: noteBoards().filter(x => x.id !== b.id), noteBoardsGone: ((state.settings || {}).noteBoardsGone || []).filter(g => g && g.id !== b.id).concat({id: b.id, at: Date.now()}).slice(-30)}); saveSettings();
    ui.noteBoard = ""; try { localStorage.setItem(NB_KEY, ""); } catch (e) {}
    dlg.close(); render();
    toast(live ? `Board deleted. Its ${live} note${live === 1 ? "" : "s"} moved to My Notes` : "Board deleted", () => {
      const list = noteBoards().filter(x => x.id !== b.id); list.splice(Math.max(0, Math.min(at, list.length)), 0, b);
      state.settings = Object.assign({}, state.settings, {noteBoards: list, noteBoardsGone: ((state.settings || {}).noteBoardsGone || []).filter(g => g && g.id !== b.id)}); saveSettings();
      const back = mine.map(n => state.notes[n.id]).filter(n => n && !n.board).map(n => ({kind: "note", id: n.id, after: Object.assign(clone(n), {board: b.id})}));
      if (back.length) applyChanges(back, null);
      ui.noteBoard = b.id; try { localStorage.setItem(NB_KEY, b.id); } catch (e) {}
      render(); toast(`${b.name} is back`);
    });
  });
}
// Text still being typed in an open note goes into the note first
function takeTypedNoteText(id){
  const n = state.notes[id]; if (!n || noteEditing !== id) return;
  const t = $("#noteText"); noteEditing = null; noteDraftClear();
  if (t && t.value !== n.text) { try { nhRecord(id, n.text, "Before this edit"); } catch(e) {} n.text = t.value; n.updated = Date.now(); }
}
function noteToBoard(id, board){
  const n = state.notes[id]; if (!n || noteBoardOf(n) === board) { render(); return; }
  takeTypedNoteText(id);
  const c = board && (noteBoards().find(b => b.id === board) || {}).courseId;
  applyChanges([{kind: "note", id, after: Object.assign(clone(n), {board, courseId: n.courseId || c || ""})}], `Moved to ${nbName(board)}`);
}
// Boards live in the synced settings, so a settings reload
const NB_BAK = "studyboard:noteBoardsBak";
function repairNoteBoards(){
  try {
    const real = b => b && b.id && !RECOVERED_NAME.test(String(b.name || ""));
    const gone = new Set((((state.settings || {}).noteBoardsGone) || []).map(g => g && g.id));
    let bak = []; try { bak = (JSON.parse(localStorage.getItem(NB_BAK) || "[]") || []).filter(real).filter(b => !gone.has(b.id)); } catch (e) {}
    const have = noteBoards(), ids = new Set(have.map(b => b.id));
    const lost = [...new Set(notesArr().map(n => n.board).filter(b => b && !ids.has(b) && !gone.has(b)))];
    const back = lost.map(id => bak.find(b => b.id === id)).filter(Boolean);
    const healed = have.map(b => RECOVERED_NAME.test(String(b.name || "")) ? (bak.find(x => x.id === b.id) || b) : b);
    if (back.length || healed.some((b, i) => b !== have[i])) { state.settings = Object.assign({}, state.settings, {noteBoards: healed.concat(back)}); saveSettings(); }
    const now = noteBoards(), keep = now.filter(real).concat(bak.filter(b => !now.some(x => x.id === b.id) && notesArr().some(n => n.board === b.id)));
    if (keep.length || !bak.length) localStorage.setItem(NB_BAK, JSON.stringify(keep));
  } catch (e) {}
}
// Full screen board
const boardMaxOn = () => document.documentElement.classList.contains("board-max");
function boardMaxBtn(cls){
  const on = boardMaxOn();
  const ic = on ? '<path d="M4 14h6v6M20 10h-6V4M10 14l-6.5 6.5M14 10l6.5-6.5"/>' : '<path d="M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5"/>';
  return `<button type="button" class="board-max-btn${cls ? " " + cls : ""}" data-act="board-max" aria-pressed="${on}" aria-label="${on ? "Exit full screen" : "Expand the board to fill the screen"}" title="${on ? "Exit Full Screen (Esc)" : "Expand"}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic}</svg></button>`;
}
function boardMax(on){
  on = !!on; if (on === boardMaxOn()) return;
  document.documentElement.classList.toggle("board-max", on);
  render();
  const b = document.querySelector(".board-max-btn"); if (b) try { b.focus({preventScroll: true}); } catch (e) {}
}
hook("render", tab => { if (tab !== "notes" && boardMaxOn()) document.documentElement.classList.remove("board-max"); });
window.addEventListener("keydown", e => {
  if (e.key !== "Escape" || e.defaultPrevented || !boardMaxOn() || dlg.open) return;
  const t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  boardMax(false);
});
// Notes has two views
const notesSwitchHtml = () => window.SBWB ? `<div class="pview-tabs nv-tabs" role="tablist" aria-label="Notes and Whiteboard"><button role="tab" data-act="nv-view" data-id="board" aria-selected="${!SBWB.on()}">Notes</button><button role="tab" data-act="nv-view" data-id="wb" aria-selected="${SBWB.on()}">Whiteboard</button></div>` : "";
function viewNotes(){
  if (window.SBWB && SBWB.on()) return notesSwitchHtml() + SBWB.view();
  return notesSwitchHtml() + viewNoteBoard();
}
function viewNoteBoard(){
  repairNoteBoards();
  const curBoard = noteBoardId();
  const onBoard = notesArr().filter(n => !n.archived && noteBoardOf(n) === curBoard);
  const archived = notesArr().filter(n => n.archived).length;
  const maxY = onBoard.reduce((m, n) => Math.max(m, n.y), 0), maxX = onBoard.reduce((m, n) => Math.max(m, n.x), 0);
  const W = maxX ? maxX + NOTE_W() + 40 : 0, H = maxY ? maxY + 260 : 0;
  return `<div class="tl-controls f-title"><h2>Notes</h2>${inPreview() ? "" : `<button class="btn small ai-btn nb-photo" data-act="note-photo" aria-label="Photo to Note" title="Turn a photo of a board or slide into a note"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg><span class="nb-photo-l">Photo to Note</span></button>`}<button class="btn small" data-act="note-export" title="Make a Word or Google Doc from your notes">Export</button>${proBtns("notes")}</div>
    ${noteBoardBar()}
    ${ui.q.trim() ? `<div class="search-note">Notes that don't match “${esc(ui.q.trim())}” are faded. <button class="link-btn" data-act="search-clear">Clear Search</button></div>` : ""}
    <div class="nb-wrap"><div class="nb-main">
      <div class="nb-scroll" id="nbScroll">
        <div class="nb-sizer" id="nbSizer"><div class="nb-board" id="nbBoard" style="width:${W}px;height:${H}px">
          ${onBoard.sort((a, b) => a.z - b.z).map(noteHtml).join("")}
          ${!onBoard.length ? `<div class="nb-empty sb-es">${emptyArt()}<strong>${curBoard ? esc(nbName(curBoard)) + " Is Empty" : "Your Board Is Empty"}</strong>Choose Add Note, or press and hold anywhere on the board, to pin a quick note.</div>` : ""}
        </div></div>
      </div>
      ${boardMaxBtn("nb-max")}${nbZoomCtl()}
      <div class="nb-targets">
        <div class="nb-target" data-drop-note="archive" role="button" tabindex="0" data-act="note-archive-open" title="Archive" aria-label="Archive, ${archived} notes">${ARCHIVE}<span>Archive</span></div>
        <div class="nb-target trash" data-drop-note="trash" role="button" tabindex="0" data-act="trash-open" data-kind="note" title="Trash" aria-label="Trash${trashVisible().filter(e => e.kind === "note").length ? ", " + trashVisible().filter(e => e.kind === "note").length + " recently deleted" : ""}. Click to see recently deleted notes, or drag a note here to delete it.">${TRASH}<span>Trash</span></div>
      </div>
    </div>${envelopeHtml()}</div>
    <p class="hint-line tip-everyday nb-hint"><span class="nbh-l">Drag to move · drop on a tab, the archive or the trash · tap to edit</span><span class="nbh-s">Drag a note to move it. Tap one to edit.</span></p>`;
}
/*NOTESPOT-START*/
// The first spot in view, row by row, where a w by h note overlaps none of the others
function noteFreeSpot(rects, view, w, h){
  const gap = 16, step = 24, hit = (x, y) => rects.some(r => x < r.x + r.w + gap && x + w + gap > r.x && y < r.y + r.h + gap && y + h + gap > r.y);
  const x0 = Math.max(16, view.x + 16), y0 = Math.max(16, view.y + 16), x1 = Math.max(x0, view.x + view.w - w - 16), y1 = Math.max(y0, view.y + view.h - h - 16);
  for (let y = y0; y <= y1; y += step) for (let x = x0; x <= x1; x += step) if (!hit(x, y)) return {x: Math.round(x), y: Math.round(y)};
  const below = rects.filter(r => r.x < x1 + w && r.x + r.w > x0).reduce((m, r) => Math.max(m, r.y + r.h), y0 - gap);
  return {x: Math.round(x0), y: Math.round(below + gap)};
}
/*NOTESPOT-END*/
const NOTE_COLOR_KEY = "studyboard:noteColor";
const noteLastColor = () => { let c = ""; try { c = localStorage.getItem(NOTE_COLOR_KEY) || ""; } catch (e) {} return NOTE_COLORS_SHOWN.some(([k]) => k === c) ? c : "yellow"; };
function newNoteAt(x, y){
  const sc = $("#nbScroll");
  if (x == null && sc) {
    const z0 = nbZ(), rects = $$("#nbBoard .note:not(.n-sheet)").map(el => ({x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight}));
    const p = noteFreeSpot(rects, {x: sc.scrollLeft / z0, y: sc.scrollTop / z0, w: sc.clientWidth / z0, h: sc.clientHeight / z0}, NOTE_W(), 160);
    x = p.x; y = p.y;
  }
  const z = notesArr().reduce((m, n) => Math.max(m, n.z || 0), 0) + 1;
  const n = normNote({id: uid(), text: "", color: noteLastColor(), x: Math.round(x || 40), y: Math.round(y || 40), z, rot: Math.round((Math.random() * 4 - 2) * 10) / 10,
    courseId: (() => { const b = noteBoards().find(x => x.id === noteBoardId()); return b && b.courseId || ""; })(), board: noteBoardId(), created: Date.now()});
  noteEditing = n.id;
  applyChanges([{kind:"note", id: n.id, after: n}], "");
  // straight away, inside the tap, so a phone raises the keyboard together with the sheet
  { const t = $("#noteText"); if (t) try { t.focus({preventScroll: true}); } catch (e) {} }
  setTimeout(() => { const t = $("#noteText"); if (t && document.activeElement !== t) t.focus({preventScroll: true}); }, 60);
}
function saveNoteText(){
  const t = $("#noteText"); const id = noteEditing;
  noteEditing = null; noteDraftClear();
  if (!t || !id || !state.notes[id]) { render(); return; }
  const n = state.notes[id];
  if (t.value !== n.text) { nhRecord(id, n.text, "Before this edit"); applyChanges([{kind:"note", id, after: Object.assign(clone(n), {text: t.value, updated: Date.now()})}], ""); }
  else render();
}
// Keyboard focus goes back to the note that was open, and stays on a note when the board redraws
let noteFocusId = null;
const noteFocus = () => { const el = noteFocusId && !noteEditing && $(`.note[data-note="${CSS.escape(noteFocusId)}"]`); if (el && document.activeElement !== el && (!document.activeElement || document.activeElement === document.body)) try { el.focus({preventScroll: true}); } catch (e) {} };
document.addEventListener("focusin", e => { const t = e.target; noteFocusId = t && t.matches && t.matches(".note[data-note]:not(.editing)") ? t.dataset.note : null; });
document.addEventListener("focusout", e => { if (e.target && e.target.isConnected && !e.relatedTarget && document.hasFocus()) noteFocusId = null; });
hook("render", tab => { if (tab === "notes") noteFocus(); });
function noteRefocus(id){
  if (!id) return;
  noteFocusId = id;
  setTimeout(() => { const el = !noteEditing && $(`.note[data-note="${CSS.escape(id)}"]`), a = document.activeElement; if (el && a !== el && (!a || a === document.body || $("#view").contains(a))) try { el.focus({preventScroll: true}); } catch (e) {} }, 60);
}
/* Note versions */
/*NOTEHIST-START*/
const NH_CAP = {per: 20, perChars: 60000, total: 300000, big: 40, text: 8000};
// How many characters were replaced or removed going from a to b
function nhRemoved(a, b){
  const m = Math.min(a.length, b.length); let i = 0;
  while (i < m && a.charCodeAt(i) === b.charCodeAt(i)) i++;
  let j = 0;
  while (j < m - i && a.charCodeAt(a.length - 1 - j) === b.charCodeAt(b.length - 1 - j)) j++;
  return a.length - i - j;
}
// Adds a snapshot to one note's list (oldest first)
function nhAdd(list, text, at, label, cap){
  cap = cap || NH_CAP; list = Array.isArray(list) ? list : [];
  text = String(text == null ? "" : text).slice(0, cap.text || 8000);
  if (!text.trim()) return list;
  const last = list[list.length - 1];
  if (last && last.text === text) return list;
  const out = list.concat([{at: Number(at) || Date.now(), text, label: String(label || "").slice(0, 40)}]);
  while (out.length > cap.per) out.shift();
  let chars = out.reduce((s, x) => s + x.text.length, 0);
  while (out.length > 1 && chars > cap.perChars) chars -= out.shift().text.length;
  return out;
}
// Keeps only notes that still exist
function nhTrimAll(map, keep, total){
  const out = {}; let chars = 0;
  Object.keys(map || {}).forEach(id => { const l = map[id]; if (Array.isArray(l) && l.length && keep(id)) { out[id] = l.filter(x => x && typeof x.text === "string"); chars += out[id].reduce((s, x) => s + x.text.length, 0); } });
  while (chars > total) {
    let oid = "", oat = Infinity;
    Object.keys(out).forEach(id => { if (out[id].length && out[id][0].at < oat) { oat = out[id][0].at; oid = id; } });
    if (!oid) break;
    chars -= out[oid].shift().text.length; if (!out[oid].length) delete out[oid];
  }
  return out;
}
// The versions Undo and Redo step through
function nhChain(texts, current){
  const out = [];
  texts.concat([current]).forEach(t => { if (!out.length || out[out.length - 1] !== t) out.push(t); });
  return out;
}
/*NOTEHIST-END*/
const NH_KEY = "studyboard:noteHist";
let nhMem = null;
const nhAll = () => {
  if (!nhMem) { try { const o = JSON.parse(localStorage.getItem(NH_KEY) || "{}"); nhMem = o && typeof o === "object" && !Array.isArray(o) ? o : {}; } catch (e) { nhMem = {}; } }
  return nhMem;
};
function nhRecord(id, text, label){
  const all = nhAll(), next = nhAdd(all[id], text, Date.now(), label);
  if (next === all[id]) return;
  all[id] = next;
  nhMem = nhTrimAll(all, k => !!(state.notes && state.notes[k]), NH_CAP.total);
  try { localStorage.setItem(NH_KEY, JSON.stringify(nhMem)); } catch (e) { }
}
const nhS = {id: "", ta: null, last: "", burst: false, timer: 0, chain: null, cur: 0, busy: false};
function nhInit(t){
  if (nhS.ta === t && nhS.id === noteEditing) return;
  clearTimeout(nhS.timer);
  Object.assign(nhS, {ta: t, id: noteEditing, last: (state.notes[noteEditing] || {}).text || "", burst: false, chain: null, cur: 0});
}
document.addEventListener("input", e => {
  const t = e.target;
  if (!t || t.id !== "noteText" || !noteEditing || !state.notes[noteEditing]) return;
  nhInit(t);
  const prev = nhS.last, now = t.value; nhS.last = now;
  if (!nhS.busy) nhS.chain = null;
  if (nhRemoved(prev, now) >= NH_CAP.big) nhRecord(nhS.id, prev, "Before a big change");
  else if (!nhS.burst) nhRecord(nhS.id, prev, "Before editing");
  nhS.burst = true; clearTimeout(nhS.timer); nhS.timer = setTimeout(() => { nhS.burst = false; }, 1500);
  noteDraftSoon(noteEditing, t.value);
});
/* A note's text is saved when its editor closes */
const NOTE_DRAFT = "studyboard:noteDraft";
let noteDraftT = 0;
function noteDraftSoon(id, text){
  clearTimeout(noteDraftT);
  noteDraftT = setTimeout(() => { try { const n = state.notes[id]; if (n && noteEditing === id) localStorage.setItem(NOTE_DRAFT, JSON.stringify({id, text, base: n.text, at: Date.now()})); } catch(e) {} }, 1000);
}
function noteDraftClear(){ clearTimeout(noteDraftT); try { localStorage.removeItem(NOTE_DRAFT); } catch(e) {} }
// The page is going away (or to the background, where a phone may end it)
function noteDraftCommit(){
  const id = noteEditing, t = $("#noteText"), n = id && state.notes[id];
  if (!t || !n || t.value === n.text) return;
  try { nhRecord(id, n.text, "Before this edit"); } catch(e) {}
  applyChanges([{kind: "note", id, after: Object.assign(clone(n), {text: t.value, updated: Date.now()})}], "");
  noteDraftClear();
}
window.addEventListener("pagehide", () => { try { noteDraftCommit(); } catch(e) {} });
document.addEventListener("visibilitychange", () => { if (document.hidden) { try { noteDraftCommit(); } catch(e) {} } });
function noteDraftRecover(){
  let d = null; try { d = JSON.parse(localStorage.getItem(NOTE_DRAFT) || "null"); } catch(e) {}
  noteDraftClear();
  const n = d && typeof d.text === "string" && state.notes[d.id];
  if (!n || n.text === d.text) return;
  if (n.text === d.base) {
    try { nhRecord(d.id, n.text, "Before a recovered draft"); } catch(e) {}
    applyChanges([{kind: "note", id: d.id, after: Object.assign(clone(n), {text: d.text, updated: Date.now()})}], "Recovered text you were typing in a note");
  } else { try { nhRecord(d.id, d.text, "Unsaved draft (recovered)"); } catch(e) {} }
}
// Puts text into the note box the way typing would, so the browser's own undo
function noteSetText(t, text){
  nhInit(t); nhS.busy = true;
  try {
    t.focus(); t.select();
    let ok = false;
    try { ok = text ? document.execCommand("insertText", false, text) : document.execCommand("delete"); } catch (e) { ok = false; }
    if (!ok || t.value !== text) { const prev = t.value; t.value = text; if (prev !== text) t.dispatchEvent(new Event("input", {bubbles: true})); }
    nhS.last = t.value;
  } finally { nhS.busy = false; }
}
function noteUndoRedo(dir){
  const t = $("#noteText"), id = noteEditing; if (!t || !id || !state.notes[id]) return;
  nhInit(t);
  if (!nhS.chain) { nhS.chain = nhChain((nhAll()[id] || []).map(x => x.text), t.value); nhS.cur = nhS.chain.length - 1; }
  const j = nhS.cur + dir;
  if (j < 0 || j >= nhS.chain.length) { toast(dir < 0 ? "No earlier version of this note" : "Nothing to redo"); t.focus(); return; }
  const target = nhS.chain[j], chain = nhS.chain;
  nhRecord(id, t.value, "Before undo");
  noteSetText(t, target);
  nhS.chain = chain; nhS.cur = j;
}
function noteVersionsSheet(id){
  const n = state.notes[id]; if (!n) return;
  const t = $("#noteText"), cur = t ? t.value : n.text;
  const when = at => new Date(at).toLocaleString(undefined, {month: "short", day: "numeric", hour: "numeric", minute: "2-digit"});
  const list = (nhAll()[id] || []).filter(x => x.text !== cur).slice().reverse();
  openSheet(`<div class="sheet">${head("Earlier Versions")}<div class="sheet-body">
    <p class="mini" style="margin:0">Studyboard keeps the last few versions of each note on this device. Restoring one keeps what you have now in this list, so you can switch back.</p>
    ${list.length ? `<ul class="nv-list">${list.map((x, i) => `<li><div class="nv-top"><span>${esc(when(x.at))}${x.label ? " · " + esc(x.label) : ""}</span><button type="button" class="btn small" data-nv="${i}">Restore</button></div><div class="nv-pre">${esc(x.text.slice(0, 300))}</div></li>`).join("")}</ul>` : `<p class="status-msg">No earlier versions yet. They appear as you edit.</p>`}
    </div><div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Close</button></div></div>`);
  dlg.querySelectorAll("[data-nv]").forEach(b => b.addEventListener("click", () => {
    const v = list[+b.dataset.nv]; if (!v) return;
    const box = $("#noteText");
    if (box && noteEditing === id) { nhRecord(id, box.value, "Before restoring"); noteSetText(box, v.text); }
    else applyChanges([{kind: "note", id, after: Object.assign(clone(n), {text: v.text, updated: Date.now()})}], "");
    dlg.close(); toast("Earlier version restored");
  }));
}

/* Notes to Word or Google Docs The Word file is a real .docx made here */
/*NOTEDOC-START*/
const NX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const nxX = s => String(s == null ? "" : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// notes: [{text, courseId, created}]; o: {title, date, courseName(id), taskTitle(note)
function noteDocModel(notes, o){
  o = o || {}; const groups = new Map();
  notes.slice().sort((a, b) => (a.created || 0) - (b.created || 0)).forEach(n => {
    const lines = String(n.text || "").replace(/\r\n?/g, "\n").split("\n");
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    const first = lines.shift() || "";
    let title = first.trim() || "Untitled note";
    if (title.length > 100) { lines.unshift(first); title = title.slice(0, 80).trim() + "…"; }
    const key = n.courseId || "";
    if (!groups.has(key)) groups.set(key, {name: key ? ((o.courseName && o.courseName(key)) || "Course") : "Other notes", notes: []});
    groups.get(key).notes.push({title, body: lines, task: (o.taskTitle && o.taskTitle(n)) || "", when: (o.when && o.when(n)) || ""});
  });
  const list = [...groups.entries()].sort((a, b) => (a[0] === "") - (b[0] === "") || a[1].name.localeCompare(b[1].name)).map(x => x[1]);
  return {title: o.title || "Studyboard Notes", date: o.date || "", groups: list, count: notes.length};
}
const nxMeta = n => [n.task ? "Attached to: " + n.task : "", n.when ? "Edited " + n.when : ""].filter(Boolean).join("  ·  ");
function noteDocHtml(m){
  const paras = lines => { const out = []; let cur = []; lines.forEach(l => { if (l.trim()) cur.push(nxX(l)); else if (cur.length) { out.push(cur); cur = []; } }); if (cur.length) out.push(cur); return out.map(p => `<p>${p.join("<br>")}</p>`).join(""); };
  return `<h1>${nxX(m.title)}</h1>${m.date ? `<p style="color:#6b7280">${nxX(m.date)}</p>` : ""}` + (m.groups.length ? m.groups.map(g =>
    `<h2>${nxX(g.name)}</h2>` + g.notes.map(n => `<h3>${nxX(n.title)}</h3>${paras(n.body)}${nxMeta(n) ? `<p style="color:#6b7280"><i>${nxX(nxMeta(n))}</i></p>` : ""}`).join("")).join("") : "<p>No notes selected.</p>");
}
function noteDocText(m){
  return [m.title, m.date].filter(Boolean).join("\n") + "\n\n" + m.groups.map(g => g.name.toUpperCase() + "\n\n" + g.notes.map(n => [n.title].concat(n.body, nxMeta(n) ? ["(" + nxMeta(n) + ")"] : []).join("\n")).join("\n\n")).join("\n\n\n") + "\n";
}
// The .docx: Title, Heading 1 per course, Heading 2 per note
function noteDocx(m, zip){
  const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main", H = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const p = (t, st) => `<w:p>${st ? `<w:pPr><w:pStyle w:val="${st}"/></w:pPr>` : ""}${t === "" ? "" : `<w:r><w:t xml:space="preserve">${nxX(String(t).replace(/\t/g, "    "))}</w:t></w:r>`}</w:p>`;
  let body = p(m.title, "Title") + (m.date ? p(m.date, "NoteMeta") : "");
  if (!m.groups.length) body += p("No notes selected.");
  m.groups.forEach(g => { body += p(g.name, "Heading1"); g.notes.forEach(n => { body += p(n.title, "Heading2") + n.body.map(l => p(l)).join("") + (nxMeta(n) ? p(nxMeta(n), "NoteMeta") : ""); }); });
  const sect = '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>';
  const sty = (id, name, rpr, ppr, extra) => `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>${extra || ""}<w:pPr>${ppr}</w:pPr><w:rPr>${rpr}</w:rPr></w:style>`;
  const styles = H + `<w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>`
    + `<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>`
    + sty("Title", "Title", '<w:b/><w:sz w:val="48"/><w:szCs w:val="48"/>', '<w:spacing w:after="60"/>')
    + sty("Heading1", "heading 1", '<w:b/><w:color w:val="1F3A5F"/><w:sz w:val="32"/><w:szCs w:val="32"/>', '<w:keepNext/><w:spacing w:before="360" w:after="120"/><w:outlineLvl w:val="0"/>')
    + sty("Heading2", "heading 2", '<w:b/><w:sz w:val="26"/><w:szCs w:val="26"/>', '<w:keepNext/><w:spacing w:before="240" w:after="80"/><w:outlineLvl w:val="1"/>')
    + sty("NoteMeta", "Note Meta", '<w:i/><w:color w:val="6B7280"/><w:sz w:val="18"/><w:szCs w:val="18"/>', '<w:spacing w:after="120"/>')
    + `</w:styles>`;
  return zip([
    {name: "[Content_Types].xml", data: H + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'},
    {name: "_rels/.rels", data: H + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'},
    {name: "word/document.xml", data: H + `<w:document xmlns:w="${W}"><w:body>${body}${sect}</w:body></w:document>`},
    {name: "word/_rels/document.xml.rels", data: H + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
    {name: "word/styles.xml", data: styles}
  ]);
}
/*NOTEDOC-END*/
const GDOC_NEW = "https://docs.google.com/document/create", GDRIVE = "https://drive.google.com/drive/my-drive";
function noteDocFor(ids){
  const list = ids.map(i => state.notes[i]).filter(Boolean);
  const stamp = (n) => { const d = n.updated || n.created; return d ? new Date(d).toLocaleDateString(undefined, {month: "short", day: "numeric", year: "numeric"}) : ""; };
  const m = noteDocModel(list, {
    title: list.length === 1 ? "Studyboard Note" : "Studyboard Notes", date: new Date().toLocaleDateString(undefined, {weekday: "long", month: "long", day: "numeric", year: "numeric"}),
    courseName: id => { const c = courseOf(id); return c ? (c.code && c.name && c.code !== c.name ? c.code + " · " + c.name : courseLabel(c)) : "Course"; },
    taskTitle: n => { const t = n.taskId && state.tasks[n.taskId]; return t ? t.title : ""; }, when: stamp
  });
  const first = m.groups[0] && m.groups[0].notes[0];
  const base = list.length === 1 && first ? first.title.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 50) : "Studyboard Notes";
  return {m, file: `${base || "Studyboard Notes"} ${todayISO()}.docx`};
}
async function noteFileSave(filename, data, mime){
  try { const dl = caps.downloads || await useCap("downloads"); if (dl) { await dl.save({filename, data}); return true; } } catch (e) { if (e && e.code === "declined") return false; }
  if (inPreview()) { toast("Downloads aren't available here"); return false; }
  saveBlob(filename, data, mime); return true;
}
async function noteCopyRich(html, text){
  try { if (navigator.clipboard && window.ClipboardItem) { await navigator.clipboard.write([new ClipboardItem({"text/html": new Blob([html], {type: "text/html"}), "text/plain": new Blob([text], {type: "text/plain"})})]); return true; } } catch (e) { }
  try {
    const d = document.createElement("div"); d.contentEditable = "true"; d.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0"; d.innerHTML = html; document.body.appendChild(d);
    const r = document.createRange(); r.selectNodeContents(d); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    const ok = document.execCommand("copy"); sel.removeAllRanges(); d.remove(); return !!ok;
  } catch (e) { return false; }
}
function noteExportSheet(preId){
  const live = notesArr().filter(n => !n.archived);
  const board = noteBoardId();
  const sel = new Set(preId && state.notes[preId] ? [preId] : live.filter(n => noteBoardOf(n) === board).map(n => n.id));
  const first = n => (String(n.text || "").split("\n").find(l => l.trim()) || "Empty note").trim().slice(0, 70);
  const byCourse = new Map();
  live.forEach(n => { const k = n.courseId && courseOf(n.courseId) ? n.courseId : ""; if (!byCourse.has(k)) byCourse.set(k, []); byCourse.get(k).push(n); });
  const keys = [...byCourse.keys()].sort((a, b) => (a === "") - (b === "") || String(a && courseLabel(courseOf(a))).localeCompare(String(b && courseLabel(courseOf(b)))));
  const cName = k => k ? courseLabel(courseOf(k)) : "No course";
  openSheet(`<div class="sheet">${head("Notes to Word or Google Docs")}<div class="sheet-body">
    ${live.length ? `<div class="nx-btns" role="group" aria-label="Choose notes"><button type="button" class="btn small" data-nx="all">All notes (${live.length})</button>${board || noteBoards().length ? `<button type="button" class="btn small" data-nx="board">This board</button>` : ""}${keys.map(k => `<button type="button" class="btn small" data-nx="course" data-k="${esc(k)}">${esc(cName(k))} (${byCourse.get(k).length})</button>`).join("")}<button type="button" class="btn small" data-nx="none">None</button></div>
    <div class="nx-list" id="nxList">${keys.map(k => `<div class="nx-h">${esc(cName(k))}</div>${byCourse.get(k).map(n => `<label><input type="checkbox" data-nxc="${esc(n.id)}" ${sel.has(n.id) ? "checked" : ""}><span><span>${esc(first(n))}</span></span></label>`).join("")}`).join("")}</div>
    <p class="mini" id="nxCount" style="margin:0"></p>
    <div class="nx-btns"><button type="button" class="btn primary" data-nx="word">Download Word (.docx)</button><button type="button" class="btn" data-nx="gdoc">Copy and Open Google Docs</button><button type="button" class="btn" data-nx="gdrive">Download for Google Drive</button></div>
    <p class="mini" style="margin:0"><strong>Google Docs:</strong> Copy and Open copies your notes as formatted text and opens a blank Google Doc: paste with Ctrl+V (Cmd+V on a Mac). Or upload the Word file to Google Drive, open it with Google Docs, then choose File, Save as Google Docs.</p>` : `<p class="status-msg">You have no notes to export yet.</p>`}
    </div><div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Close</button></div></div>`);
  if (!live.length) return;
  const root = dlg.querySelector(".sheet"), boxes = () => [...root.querySelectorAll("[data-nxc]")];
  const draw = () => { boxes().forEach(b => { b.checked = sel.has(b.dataset.nxc); }); const c = sel.size; root.querySelector("#nxCount").textContent = c ? `${c} note${c === 1 ? "" : "s"} selected` : "Choose at least one note."; root.querySelectorAll('[data-nx="word"],[data-nx="gdoc"],[data-nx="gdrive"]').forEach(b => { b.disabled = !c; }); };
  draw();
  const pick = ids => { sel.clear(); ids.forEach(i => sel.add(i)); draw(); };
  root.addEventListener("change", e => { const b = e.target.closest && e.target.closest("[data-nxc]"); if (b) { if (b.checked) sel.add(b.dataset.nxc); else sel.delete(b.dataset.nxc); draw(); } });
  root.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest("[data-nx]"); if (!b) return;
    const k = b.dataset.nx;
    if (k === "all") pick(live.map(n => n.id));
    else if (k === "none") pick([]);
    else if (k === "board") pick(live.filter(n => noteBoardOf(n) === noteBoardId()).map(n => n.id));
    else if (k === "course") pick((byCourse.get(b.dataset.k) || []).map(n => n.id));
    else if (sel.size) {
      const ids = live.filter(n => sel.has(n.id)).map(n => n.id), {m, file} = noteDocFor(ids);
      if (k === "gdoc") {
        let w = null; try { w = window.open(GDOC_NEW, "_blank", "noopener"); } catch (err) {}
        const ok = await noteCopyRich(noteDocHtml(m), noteDocText(m));
        toast(ok ? (w ? "Copied. Paste into the new Google Doc with Ctrl+V (Cmd+V on a Mac)." : "Copied. Open a new Google Doc and paste with Ctrl+V (Cmd+V on a Mac).") : "Couldn't copy. Download the Word file instead.");
      } else {
        const bytes = noteDocx(m, zipMany);
        if (await noteFileSave(file, bytes, NX_MIME)) {
          if (k === "gdrive") { try { window.open(GDRIVE, "_blank", "noopener"); } catch (err) {} toast("Saved. Upload it to Google Drive, open it with Google Docs, then File, Save as Google Docs."); }
          else toast("Word file saved");
        }
      }
    }
  });
}
function noteToTrash(id){
  const n = state.notes[id]; if (!n) return;
  takeTypedNoteText(id);
  applyChanges([{kind:"note", id, after: null}], "Note deleted");
}
function noteToArchive(id){
  const n = state.notes[id]; if (!n) return;
  takeTypedNoteText(id);
  applyChanges([{kind:"note", id, after: Object.assign(clone(n), {archived: true, archivedAt: Date.now()})}], "Note archived");
}
function archiveSheet(){
  let q = "";
  openSheet(`<div class="sheet">${head("Archived Notes")}<div class="sheet-body">
    <input type="search" id="arQ" placeholder="Search archived notes" aria-label="Search archived notes" data-noenter>
    <div id="arList" class="ar-list"></div></div></div>`);
  const draw = () => {
    const list = notesArr().filter(n => n.archived && (!q || n.text.toLowerCase().includes(q))).sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
    $("#arList").innerHTML = list.map(n => { const c = courseOf(n.courseId); return `<div class="ar-note" style="--nc:${noteColor(n.color)}">
      <div class="ar-text">${esc(n.text) || `<span class="note-empty">Empty note</span>`}</div>
      <div class="ar-meta">${c ? `<span class="note-tag" style="--c:${esc(c.color)}">${esc(courseLabel(c))}</span>` : ""}<span class="mini">Archived ${esc(new Date(n.archivedAt || n.updated || n.created || Date.now()).toLocaleDateString(undefined, {month:"short", day:"numeric", year:"numeric"}))}</span><span class="spacer"></span>
        <button type="button" class="link-btn" data-ar="restore" data-id="${esc(n.id)}">Put Back</button>
        ${caps.assets ? `<button type="button" class="link-btn" data-ar="file" data-id="${esc(n.id)}">Save to Files</button>` : ""}
        <button type="button" class="link-btn danger-link" data-ar="delete" data-id="${esc(n.id)}">Delete</button></div></div>`; }).join("")
      || `<p class="status-msg">${q ? "No archived notes match." : (phoneLike() ? "Nothing archived yet. Open a note and tap its Archive button (the folder)." : "Nothing archived yet. Drag a note onto the folder, or open it and choose Archive.")}</p>`;
  };
  draw();
  $("#arQ").addEventListener("input", e => { q = e.target.value.trim().toLowerCase(); draw(); });
  $("#arList").addEventListener("click", async e => {
    const b = e.target.closest("[data-ar]"); if (!b) return;
    const n = state.notes[b.dataset.id]; if (!n) return;
    if (b.dataset.ar === "restore") {
      const z = notesArr().reduce((m, x) => Math.max(m, x.z || 0), 0) + 1;
      applyChanges([{kind:"note", id: n.id, after: Object.assign(clone(n), {archived: false, z})}], "Note put back on the board");
    } else if (b.dataset.ar === "delete") {
      applyChanges([{kind:"note", id: n.id, after: null}], "Archived note deleted");
    } else if (b.dataset.ar === "file") {
      const first = (n.text.trim().split("\n")[0] || "Note").replace(/[\\/:*?"<>|]+/g, "").slice(0, 40).trim() || "Note";
      const file = new File([n.text + "\n"], first + ".txt", {type: "text/plain"});
      const made = await uploadFiles([file], {courseId: n.courseId || "", folderId: "notes"});
      if (made.length) toast(`Saved to ${courseOf(n.courseId) ? courseLabel(courseOf(n.courseId)) : "General"} › ${(foldersOf(n.courseId).find(f => f.id === "notes") || {name: "Other"}).name}`);
    }
    setTimeout(draw, 30);
  });
}


/* Keyboard open: every bottom sheet sits above the keyboard and never taller than what is visible */
function dlgKbFit(){
  const vv = window.visualViewport; if (!vv || !matchMedia("(max-width:639px)").matches) return;
  // in the iPhone app the keyboard plugin shrinks the app itself and says when the keyboard is up (native-bridge.js)
  if (document.documentElement.classList.contains("kb-native")) return;
  // kb: how far the keyboard's top is above the bottom of the page's frame (where sheets are pinned). Whether the keyboard
  // is up at all is the visible area's height alone: iOS also slides the page up to reveal a text box, which made kb small
  // and hid the fact the keyboard was up
  const d = document.documentElement, kb = Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop));
  d.style.setProperty("--kb-h", kb + "px"); d.style.setProperty("--vv-h", Math.round(vv.height) + "px");
  d.classList.toggle("kb-open", innerHeight - vv.height > 120);
}
if (window.visualViewport) { visualViewport.addEventListener("resize", dlgKbFit); visualViewport.addEventListener("scroll", dlgKbFit); }
