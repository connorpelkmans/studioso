/* ===== module: 01-files-io.js: the app's core, calendar export, zip archives, automatic backups, the desktop app's folder ===== */
/* ---------- Calendar export (.ics inside a .zip) ---------- */
function icsEscape(s){ return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
function fold(line){ const out = []; while (line.length > 74) { out.push(line.slice(0, 74)); line = " " + line.slice(74); } out.push(line); return out.join("\r\n"); }
function buildIcs(){
  const now = new Date(), stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Studyboard//Student planner//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Studyboard deadlines"];
  const from = addDays(todayISO(), -1);
  const ts = tasksArr().filter(t => t.due && t.status !== "done" && t.due >= from);
  ts.forEach(t => {
    const c = courseOf(t.courseId);
    lines.push("BEGIN:VEVENT", "UID:" + t.id + "@coursework", "DTSTAMP:" + stamp);
    lines.push(fold("SUMMARY:" + icsEscape((c ? courseLabel(c) + ": " : "") + t.title)));
    const d = t.due.replace(/-/g, "");
    if (t.time) {
      const e = parse(t.due); const [h, m] = t.time.split(":").map(Number); e.setHours(h, m + 30);
      lines.push("DTSTART:" + d + "T" + t.time.replace(":", "") + "00", "DTEND:" + iso(e).replace(/-/g, "") + "T" + pad(e.getHours()) + pad(e.getMinutes()) + "00");
    } else {
      lines.push("DTSTART;VALUE=DATE:" + d, "DTEND;VALUE=DATE:" + addDays(t.due, 1).replace(/-/g, ""));
    }
    lines.push(fold("DESCRIPTION:" + icsEscape([t.type, "Priority: " + PRIO[t.priority], t.notes].filter(Boolean).join("\n"))));
    lines.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEscape(t.title + " is due"), t.time ? "TRIGGER:-P1D" : "TRIGGER:-PT15H", "END:VALARM", "END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return {text: lines.join("\r\n") + "\r\n", count: ts.length};
}
function crc32(bytes){
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) { let c = (crc ^ bytes[i]) & 0xFF; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function zipOne(name, text){
  const enc = new TextEncoder(), data = enc.encode(text), nm = enc.encode(name), crc = crc32(data);
  const lh = new DataView(new ArrayBuffer(30)), ch = new DataView(new ArrayBuffer(46)), ed = new DataView(new ArrayBuffer(22));
  lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true); lh.setUint16(10, 0, true); lh.setUint16(12, 33, true);
  lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, nm.length, true); lh.setUint16(28, 0, true);
  ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true); ch.setUint16(12, 0, true); ch.setUint16(14, 33, true);
  ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, nm.length, true);
  ch.setUint16(30, 0, true); ch.setUint16(32, 0, true); ch.setUint16(34, 0, true); ch.setUint16(36, 0, true); ch.setUint32(38, 0, true); ch.setUint32(42, 0, true);
  const cdOff = 30 + nm.length + data.length, cdSize = 46 + nm.length;
  ed.setUint32(0, 0x06054b50, true); ed.setUint16(4, 0, true); ed.setUint16(6, 0, true); ed.setUint16(8, 1, true); ed.setUint16(10, 1, true); ed.setUint32(12, cdSize, true); ed.setUint32(16, cdOff, true); ed.setUint16(20, 0, true);
  const out = new Uint8Array(cdOff + cdSize + 22);
  let p = 0;
  for (const part of [new Uint8Array(lh.buffer), nm, data, new Uint8Array(ch.buffer), nm, new Uint8Array(ed.buffer)]) { out.set(part, p); p += part.length; }
  return out;
}
function calExportSheet(){
  const {count} = buildIcs();
  openSheet(`<div class="sheet">${head("Add Deadlines to Your Calendar")}<div class="sheet-body">
    <p style="margin:0">This downloads a calendar file with your ${count} upcoming deadline${count === 1 ? "" : "s"}, each with a reminder the day before.</p>
    <p class="status-msg" style="margin:0">Unzip the download, then open the .ics file inside. Apple Calendar and Outlook import it when you open it. For Google Calendar, go to Settings, then Import & export. Importing again after changes can create duplicates in some calendars. To add a single task, open it here and choose Add to Google Calendar.</p>
    </div><div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" id="calDl" ${count ? "" : "disabled"}>Download Calendar File</button></div></div>`);
  $("#calDl").addEventListener("click", async () => {
    const {text} = buildIcs();
    const dl = caps.downloads || await useCap("downloads");
    if (!dl) {
      if (!inClaude()) { saveBlob("studyboard-deadlines.ics", text, "text/calendar"); dlg.close(); toast("Calendar file saved"); return; }
      toast("Downloads aren't available here"); return;
    }
    try { await dl.save({filename: "studyboard-deadlines.zip", data: zipOne("studyboard-deadlines.ics", text)}); dlg.close(); toast("Calendar file saved"); }
    catch(e) {
      if (e && e.code === "declined") return;
      toast(e && e.code === "extension_not_enabled" ? "Calendar files can't be downloaded here" : "Couldn't save the file. Try again.");
    }
  });
}

/* ---------- Zip archives (backups that include your uploaded files) ---------- */
function zipMany(entries){
  const enc = new TextEncoder(), parts = [], central = [];
  let off = 0;
  entries.forEach(({name, data}) => {
    const nm = enc.encode(name), d = data instanceof Uint8Array ? data : enc.encode(String(data)), crc = crc32(d);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(12, 33, true);
    lh.setUint32(14, crc, true); lh.setUint32(18, d.length, true); lh.setUint32(22, d.length, true); lh.setUint16(26, nm.length, true);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(14, 33, true);
    ch.setUint32(16, crc, true); ch.setUint32(20, d.length, true); ch.setUint32(24, d.length, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
    parts.push(new Uint8Array(lh.buffer), nm, d); central.push(new Uint8Array(ch.buffer), nm);
    off += 30 + nm.length + d.length;
  });
  const cdSize = central.reduce((s, x) => s + x.length, 0);
  const ed = new DataView(new ArrayBuffer(22));
  ed.setUint32(0, 0x06054b50, true); ed.setUint16(8, entries.length, true); ed.setUint16(10, entries.length, true); ed.setUint32(12, cdSize, true); ed.setUint32(16, off, true);
  const all = [...parts, ...central, new Uint8Array(ed.buffer)];
  const out = new Uint8Array(all.reduce((s, x) => s + x.length, 0));
  let p = 0; all.forEach(x => { out.set(x, p); p += x.length; });
  return out;
}
function unzipStored(buf){
  const u = new Uint8Array(buf), dv = new DataView(u.buffer, u.byteOffset, u.byteLength), dec = new TextDecoder(), out = [];
  let p = 0;
  while (p + 30 <= u.length && dv.getUint32(p, true) === 0x04034b50) {
    const method = dv.getUint16(p + 8, true), size = dv.getUint32(p + 18, true), nl = dv.getUint16(p + 26, true), xl = dv.getUint16(p + 28, true);
    if (method !== 0) throw new Error("compressed");
    if (out.length >= 20000 || p + 30 + nl + xl + size > u.length) throw new Error("damaged");
    const name = dec.decode(u.subarray(p + 30, p + 30 + nl)), start = p + 30 + nl + xl;
    out.push({name, data: u.slice(start, start + size)});
    p = start + size;
  }
  return out;
}
async function assetBytes(id){
  if (DESK) { const hit = deskRevOf(id); if (hit) { for (const rel of deskCandidates(hit.f, hit.i)) { const b = await DESK.read(rel); if (b) return b; } } }
  if (/^local:/.test(id)) throw new Error("This file is only on the computer it was added from");
  // a copy kept on this device needs no sign-in (right after a reload, sign-in is still being restored)
  if (!inClaude() && FCACHE.ok(id)) { const hit = await FCACHE.get(id); if (hit) { FCACHE.hits++; return new Uint8Array(await hit.arrayBuffer()); } }
  if (inClaude()) { const r = await fetch("/_blob/" + id); if (!r.ok) throw new Error("fetch " + r.status); return new Uint8Array(await r.arrayBuffer()); }
  if (!sbActive()) throw new Error("not signed in");
  const data = await sbDownload(id).catch(e => { throw new Error((e && e.message) || "download failed"); });
  return new Uint8Array(await data.arrayBuffer());
}
// Everything in one file: your data plus every uploaded file and revision.
async function exportFullBackup(){
  const entries = [{name: "studyboard-backup.json", data: JSON.stringify(Object.assign({app: "studyboard"}, exportArrays()), null, 2)}];
  const revs = Object.values(state.files).filter(f => f.kind === "file").flatMap(f => f.revs.map(r => r.assetId)).filter(Boolean);
  let missing = 0;
  for (let i = 0; i < revs.length; i++) {
    toast(`Packing files: ${i + 1} of ${revs.length}…`);
    try { entries.push({name: "files/" + revs[i], data: await assetBytes(revs[i])}); } catch(e) { missing++; }
  }
  const zip = zipMany(entries), name = `studyboard-backup-with-files-${todayISO()}.zip`;
  if (inClaude()) {
    const dl = caps.downloads || await useCap("downloads");
    if (!dl) { toast("Downloads aren't available here"); return; }
    try { await dl.save({filename: name, data: zip}); } catch(e) { if (!(e && e.code === "declined")) toast("Couldn't save the file. Try again."); return; }
  } else { saveBlob(name, zip, "application/zip"); try { localStorage.setItem("studioso:lastExport", String(Date.now())); } catch(e) {} }
  toast(missing ? `Backup saved, but ${missing} file${missing === 1 ? "" : "s"} couldn't be included` : `Backup saved with ${revs.length} file${revs.length === 1 ? "" : "s"}`);
}
// Brings a backup's files into this app's storage and points the file records at the new copies.
async function importBackupFiles(files, zipEntries){
  const byName = new Map(zipEntries.map(e => [e.name, e.data]));
  const assets = await getAssets();
  let moved = 0, skipped = 0;
  const out = [];
  for (const f of files) {
    const g = clone(f);
    if (g.kind === "file") {
      for (const r of g.revs) {
        const bytes = byName.get("files/" + r.assetId);
        if (!bytes || !assets) { skipped++; continue; }
        try {
          toast(`Restoring files: ${moved + skipped + 1}…`);
          const up = await assets.upload(new File([bytes], r.name || g.name, {type: r.type || "application/octet-stream"}), {type: r.type || "application/octet-stream", untrusted: true});
          r.assetId = up.id; moved++;
        } catch(e) { skipped++; }
      }
    }
    out.push(g);
  }
  return {files: out, moved, skipped};
}

/* ---------- Automatic backups to a folder on your computer (Chrome and Edge) ---------- */
const FSB = {supported: () => !inClaude() && (!!DESK || typeof window.showDirectoryPicker === "function"), dir: null, status: "off", last: 0, where: "", busy: false, timer: null};
function idb(){ return new Promise((res, rej) => { const r = indexedDB.open("studioso-fs", 1); r.onupgradeneeded = () => r.result.createObjectStore("h"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function idbGet(k){ const db = await idb(); return new Promise(res => { const t = db.transaction("h").objectStore("h").get(k); t.onsuccess = () => res(t.result); t.onerror = () => res(null); }); }
async function idbSet(k, v){ const db = await idb(); return new Promise(res => { const t = db.transaction("h", "readwrite"); t.objectStore("h").put(v, k); t.oncomplete = () => res(true); t.onerror = () => res(false); }); }
async function idbDel(k){ const db = await idb(); return new Promise(res => { const t = db.transaction("h", "readwrite"); t.objectStore("h").delete(k); t.oncomplete = () => res(true); t.onerror = () => res(false); }); }
async function initFolderBackup(){
  if (DESK) {
    FSB.dir = deskDir(""); FSB.where = await DESK.dataDir(); FSB.status = "on";
    FSB.last = Number(localStorage.getItem("studioso:fsLast") || 0);
    scheduleRender(); scheduleFolderBackup(3000); return;
  }
  if (!FSB.supported()) return;
  try {
    const h = await idbGet("dir");
    if (!h) return;
    FSB.dir = h; FSB.where = (() => { try { return localStorage.getItem("studioso:fsWhere") || h.name; } catch(e) { return h.name; } })();
    FSB.last = Number(localStorage.getItem("studioso:fsLast") || 0);
    const p = await h.queryPermission({mode: "readwrite"});
    FSB.status = p === "granted" ? "on" : "paused";
    scheduleRender();
    if (FSB.status === "on") scheduleFolderBackup(4000);
  } catch(e) { console.warn(e); }
}
const CLOUD_NAME = {gdrive: "Google Drive", onedrive: "OneDrive", other: ""};
// Google Drive and OneDrive go straight to the cloud through the same connection as saving files (free), with nothing to
// install; without it, a folder that the Google Drive or OneDrive app syncs.
const cloudBk = () => window.SBCLOUD && SBCLOUD.backup;
const BK_PROV = {gdrive: "google", onedrive: "microsoft"};
function cloudBackupTo(kind){
  const B = cloudBk(), p = BK_PROV[kind]; if (!B || !p || !B.possible(p)) return false;
  if (!B.connected(p)) {
    const url = B.connectUrl(p);
    if (url) { window.open(url, "_blank", "noopener"); toast(`Allow Studyboard in the page that opened. Backups to ${B.name(p)} start as soon as it's connected.`); }
    else if (dlg.open && dlg.querySelector(".sheet.ob")) toast(`Connect ${B.name(p)} from Files, Cloud after the tour, and backups start right away.`);
    else { if (dlg.open) dlg.close(); setTimeout(() => SBCLOUD.open(), 60); toast(`Connect ${B.name(p)} here. Backups start as soon as it's connected.`); }
  }
  B.want(p);
  return true;
}
async function chooseBackupFolder(kind){
  if (cloudBackupTo(kind)) return;
  if (!FSB.supported()) { toast("Automatic folder backups need Chrome or Edge on a computer"); return; }
  try {
    const picked = await window.showDirectoryPicker({id: "studioso-backups", mode: "readwrite", startIn: kind === "gdrive" ? "desktop" : "documents"});
    // Keep everything in one tidy "Studyboard Backups" folder inside whatever was picked.
    const h = /^(studioso|studyboard) backups$/i.test(picked.name) ? picked : await picked.getDirectoryHandle("Studyboard Backups", {create: true});
    await idbSet("dir", h);
    const label = CLOUD_NAME[kind] ? `${CLOUD_NAME[kind]} › ${picked.name === h.name ? h.name : picked.name + " › Studyboard Backups"}` : (picked.name === h.name ? h.name : picked.name + " › Studyboard Backups");
    try { localStorage.setItem("studioso:fsWhere", label); } catch(e) {}
    FSB.dir = h; FSB.where = label; FSB.status = "on";
    await runFolderBackup();
    toast(`Automatic backups are on, saving to ${label}`);
  } catch(e) { if (e && e.name !== "AbortError") toast("Couldn't use that folder. Try another one."); }
  scheduleRender();
}
function backupWhereSheet(){
  // With the Google Drive / OneDrive connection, those two go straight to the cloud: nothing to install, no folder to pick
  const B = cloudBk(), via = k => !!(B && B.possible(BK_PROV[k]));
  if (B) ["gdrive", "onedrive"].forEach(k => { if (via(k) && !B.connected(BK_PROV[k])) B.connectUrl(BK_PROV[k]); });
  const cloudCard = (kind, title) => card(kind, title, [B.connected(BK_PROV[kind]) ? `Your ${title} is connected.` : `Click the button below and allow Studyboard in the page that opens.`, `Every hour, a backup of everything goes to <b>Studyboard › Backups</b> in your ${title}. The latest also shows in Files, and you can restore any day from Restore a Backup.`], `Back Up to ${title}`);
  if (!FSB.supported() && !via("gdrive") && !via("onedrive")) { toast("Automatic backups need Chrome or Edge on a computer, or Google Drive or OneDrive connected"); return; }
  const card = (kind, title, steps, btn) => `<div class="bk-opt"><div class="bk-head"><span class="bk-ico bk-${kind}" aria-hidden="true">${BRAND_LOGO[kind] || ""}</span><strong>${title}</strong></div><ol>${steps.map(x => `<li>${x}</li>`).join("")}</ol><button type="button" class="btn small ${kind === "other" ? "" : "primary"}" data-fsb="${kind}">${btn}</button></div>`;
  openSheet(`<div class="sheet">${head("Automatic Backups")}<div class="sheet-body">
    <p style="margin:0">${via("gdrive") || via("onedrive") ? "Studyboard backs up everything every hour while it's open, straight to your Google Drive or OneDrive, or to a folder on this computer." : "Studyboard saves a backup of everything, plus copies of your uploaded files, to a folder on this computer every hour while it's open. Pick a folder that Google Drive or OneDrive syncs and the backups go to the cloud too, with version history."}</p>
    ${via("gdrive") ? cloudCard("gdrive", "Google Drive") : !FSB.supported() ? "" : card("gdrive", "Google Drive", [`Install <a href="https://www.google.com/drive/download/" target="_blank" rel="noopener noreferrer">Google Drive for desktop</a> and sign in, if you haven't.`, "Click the button below. In the window that opens, choose <b>Google Drive</b> (on Windows it's the <b>G:</b> drive), then <b>My Drive</b>.", "Click <b>Select Folder</b>, then <b>Allow</b>/<b>Edit files</b>."], "Choose My Drive")}
    ${via("onedrive") ? cloudCard("onedrive", "OneDrive") : !FSB.supported() ? "" : card("onedrive", "OneDrive", ["OneDrive comes with Windows. Make sure you're signed in (cloud icon in the taskbar).", "Click the button below and choose the <b>OneDrive</b> folder, usually in your user folder, or its <b>Documents</b> folder.", "Click <b>Select Folder</b>, then <b>Allow</b>/<b>Edit files</b>."], "Choose OneDrive Folder")}
    ${!FSB.supported() ? "" : card("other", "Another Folder", ["Any folder on this computer or a USB drive works too, but it's only as safe as that disk."], "Choose a Folder")}
    ${FSB.supported() ? `<p class="mini" style="margin:0">For a folder, one named “Studyboard Backups” is created inside the one you pick.</p>` : ""}
  </div></div>`);
  $$("[data-fsb]", dlg).forEach(b => b.addEventListener("click", () => { const k = b.dataset.fsb; dlg.close(); chooseBackupFolder(k); }));
}
async function resumeFolderBackup(){
  if (!FSB.dir) return backupWhereSheet();
  try {
    const p = await FSB.dir.requestPermission({mode: "readwrite"});
    if (p === "granted") { FSB.status = "on"; await runFolderBackup(); toast("Automatic backups resumed"); }
  } catch(e) {}
  scheduleRender();
}
async function stopFolderBackup(){ await idbDel("dir"); FSB.dir = null; FSB.status = "off"; scheduleRender(); toast("Automatic folder backups turned off. Files already saved stay in the folder."); }
function scheduleFolderBackup(ms){ if (FSB.status !== "on") return; clearTimeout(FSB.timer); FSB.timer = setTimeout(() => fxDefer(runFolderBackup), Math.max(ms, fxBusyMs() + 400)); }
async function writeText(dir, name, text){ const fh = await dir.getFileHandle(name, {create: true}); const w = await fh.createWritable(); await w.write(text); await w.close(); }
const safeName = s => String(s || "").replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "_").replace(/\s+/g, " ").trim().slice(0, 100) || "Untitled";
async function runFolderBackup(){
  if (FSB.status !== "on" || !FSB.dir || FSB.busy) return;
  FSB.busy = true;
  try {
    // Never replace a good backup with an empty copy (an empty page can mean a failed load, a bad import or a sync that hasn't arrived yet)
    if (!["tasks", "courses", "notes", "decks", "files", "events"].some(k => Object.keys(state[k] || {}).length)) { FSB.busy = false; return; }
    let owner = ""; try { owner = localStorage.getItem(OWNER) || NO_OWNER; } catch(e) {}
    const json = JSON.stringify(Object.assign({app: "studyboard", savedAt: new Date().toISOString(), owner}, exportArrays()), null, 1);
    await writeText(FSB.dir, "studyboard-latest.json", json);                                // always current
    const daily = await FSB.dir.getDirectoryHandle("Daily backups", {create: true});
    await writeText(daily, `studyboard-${todayISO()}.json`, json);                          // one per day
    const names = []; for await (const [n, h] of daily.entries()) if (h.kind === "file" && /^(studioso|studyboard)-\d{4}-\d{2}-\d{2}\.json$/.test(n)) names.push(n);
    names.sort(); for (const n of names.slice(0, Math.max(0, names.length - 90))) { try { await daily.removeEntry(n); } catch(e) {} }  // keep 90 days
    // Copies of uploaded files, organized by course and folder
    const done = (() => { try { return JSON.parse(localStorage.getItem("studioso:fsFiles") || "{}"); } catch(e) { return {}; } })();
    const filesDir = await FSB.dir.getDirectoryHandle("Files", {create: true});
    let copied = 0;
    for (const f of Object.values(state.files)) {
      if (f.kind !== "file") continue;
      for (let i = 0; i < f.revs.length; i++) {
        const r = f.revs[i];
        if (!r.assetId || done[r.assetId] || copied >= 25) continue;
        try {
          const c = courseOf(f.courseId), fo = foldersOf(f.courseId).find(x => x.id === f.folderId);
          const d1 = await filesDir.getDirectoryHandle(safeName(c ? courseLabel(c) : "General"), {create: true});
          const d2 = await d1.getDirectoryHandle(safeName(fo ? fo.name : "Other"), {create: true});
          const base = safeName(r.name || f.name), fname = f.revs.length > 1 ? base.replace(/(\.[^.]+)?$/, ` (Rev ${revLetter(i)})$1`) : base;
          const bytes = await assetBytes(r.assetId);
          const fh = await d2.getFileHandle(fname, {create: true}); const w = await fh.createWritable(); await w.write(bytes); await w.close();
          done[r.assetId] = 1; copied++;
        } catch(e) { /* try again next time */ }
      }
    }
    try { localStorage.setItem("studioso:fsFiles", JSON.stringify(done)); } catch(e) {}
    FSB.last = Date.now();
    try { localStorage.setItem("studioso:fsLast", String(FSB.last)); localStorage.setItem("studioso:lastExport", String(FSB.last)); } catch(e) {}
    if (copied >= 25) scheduleFolderBackup(15000);
  } catch(e) {
    console.warn("Folder backup failed", e);
    if (e && (e.name === "NotAllowedError" || e.name === "SecurityError")) FSB.status = "paused";
    else if (e && e.name === "NotFoundError") { FSB.status = "paused"; toast("The backup folder was moved or deleted. Choose it again in Settings."); }
  }
  FSB.busy = false;
  scheduleRender();
}
setInterval(() => scheduleFolderBackup(0), 60 * 60000);
function cloudBackupRow(){
  const B = cloudBk(); if (!B) return "";
  const p = B.provider(), st = B.state();
  if (B.on()) {
    const ago = st.last ? (() => { const m = Math.round((Date.now() - st.last) / 60000); return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : Math.round(m / 1440) + " days ago"; })() : "not yet";
    return `<div class="cap-row" style="flex-wrap:wrap"><span style="flex:1;min-width:200px;font-weight:600">Automatic Backups<span class="sub">${st.busy ? "Backing up now…" : st.err ? esc(st.err) : `Saving to ${esc(B.name(p))} › Studyboard › Backups every hour, last saved ${ago}. The latest is in Files and in Restore a Backup.`}</span></span><button class="btn small" data-act="cbk-now"${st.busy ? " disabled" : ""}>Back Up Now</button><button class="btn small" data-act="cbk-stop">Stop</button></div>`;
  }
  if (B.pending()) return `<div class="cap-row" style="flex-wrap:wrap"><span style="flex:1;min-width:200px;font-weight:600">Automatic Backups<span class="sub">Waiting for ${esc(B.name(B.pending()))} to connect. Finish in the page that opened.</span></span><button class="btn small" data-act="cbk-stop">Cancel</button></div>`;
  return "";
}
function folderBackupRow(){
  if (inClaude()) return "";
  { const c = !DESK && cloudBackupRow(); if (c) return c; }
  if (!DESK && !FSB.supported() && cloudBk() && (cloudBk().possible("google") || cloudBk().possible("microsoft")))
    return `<div class="cap-row" style="flex-wrap:wrap"><span style="flex:1;min-width:200px;font-weight:600">Automatic Backups<span class="sub">Back up everything to your Google Drive or OneDrive every hour.</span></span>${cloudBk().possible("google") ? `<button class="btn small" data-act="cbk-go" data-id="gdrive">Google Drive</button>` : ""}${cloudBk().possible("microsoft") ? `<button class="btn small" data-act="cbk-go" data-id="onedrive">OneDrive</button>` : ""}</div>`;
  if (DESK) {
    const ago = FSB.last ? (() => { const m = Math.round((Date.now() - FSB.last) / 60000); return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : Math.round(m / 1440) + " days ago"; })() : "not yet";
    return `<div class="cap-row" style="flex-wrap:wrap"><span style="flex:1;min-width:220px;font-weight:600">Studyboard Folder on This Computer<span class="sub">Your data, daily backups and every uploaded file are kept in ${esc(FSB.where)} (last saved ${ago}). Pick a folder inside OneDrive or Google Drive for an extra cloud copy.</span></span><button class="btn small primary" data-act="desk-open">Open Folder</button><button class="btn small" data-act="desk-choose">Change</button></div>
      <div class="cap-row"><span style="flex:1;font-weight:600">Studyboard for ${DESK.platform === "darwin" ? "Mac" : "Windows"}<span class="sub">Version ${esc(DESK.version)}. Works offline and syncs with your account when you're online.</span></span></div>`;
  }
  if (!FSB.supported()) return `<div class="cap-row"><span style="flex:1;font-weight:600">Automatic Backups<span class="sub">Folder backups need Chrome or Edge on a computer. On this device, use Export a Backup File.</span></span></div>`;
  const ago = FSB.last ? (() => { const m = Math.round((Date.now() - FSB.last) / 60000); return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : Math.round(m / 1440) + " days ago"; })() : "not yet";
  const sub = FSB.status === "on" ? `Saving to “${esc(FSB.where)}”, last saved ${ago}` : FSB.status === "paused" ? `Paused. Your browser needs permission again for “${esc(FSB.where)}”.` : "Back up automatically to Google Drive, OneDrive or a folder on this computer";
  const btns = FSB.status === "on" ? `<button class="btn small" data-act="fsb-choose">Change</button><button class="btn small" data-act="fsb-stop">Stop</button>`
    : FSB.status === "paused" ? `<button class="btn small primary" data-act="fsb-resume">Resume</button><button class="btn small" data-act="fsb-choose">Change</button>`
    : `<button class="btn small primary" data-act="fsb-choose">Set Up</button>`;
  return `<div class="cap-row" style="flex-wrap:wrap"><span style="flex:1;min-width:200px;font-weight:600">Automatic Backups<span class="sub">${sub}</span></span>${btns}</div>`;
}


/* ---------- Desktop app: local folder, offline files, clean shutdown ---------- */
// A small stand-in for the browser's folder handles, so automatic backups write straight into the Studyboard folder.
function deskDir(rel, name){
  const join = n => (rel ? rel + "/" : "") + n;
  const bytesOf = async parts => {
    if (parts.every(x => typeof x === "string")) return parts.join("");
    const arr = await Promise.all(parts.map(async x => typeof x === "string" ? new TextEncoder().encode(x) : x instanceof Blob ? new Uint8Array(await x.arrayBuffer()) : x instanceof ArrayBuffer ? new Uint8Array(x) : x));
    const out = new Uint8Array(arr.reduce((n, a) => n + a.length, 0)); let o = 0; arr.forEach(a => { out.set(a, o); o += a.length; }); return out;
  };
  return {kind: "directory", name: name || "Studyboard", rel,
    getDirectoryHandle: async (n, o) => { const r = join(n); if (o && o.create) await DESK.mkdir(r); else if (!(await DESK.exists(r))) throw Object.assign(new Error("Not found"), {name: "NotFoundError"}); return deskDir(r, n); },
    getFileHandle: async n => ({name: n, kind: "file", createWritable: async () => { const parts = []; return {write: async d => { parts.push(d); }, close: async () => { await DESK.write(join(n), await bytesOf(parts), /^Files(\/|$)/.test(join(n)) ? {untrusted: true} : undefined); }}; }}),
    entries: async function* () { for (const e of await DESK.list(rel)) yield [e.name, {kind: e.dir ? "directory" : "file", name: e.name}]; },
    removeEntry: async n => DESK.remove(join(n)),
    queryPermission: async () => "granted", requestPermission: async () => "granted"};
}
const deskDone = () => { try { return JSON.parse(localStorage.getItem("studioso:fsFiles") || "{}"); } catch(e) { return {}; } };
function deskMarkDone(id){ const d = deskDone(); d[id] = 1; try { localStorage.setItem("studioso:fsFiles", JSON.stringify(d)); } catch(e) {} }
function deskMirrorRel(f, i, courseId, folderId){
  const cid = courseId != null ? courseId : f.courseId, fid = folderId != null ? folderId : f.folderId;
  const c = courseOf(cid) || state.courses[cid], fo = foldersOf(cid).find(x => x.id === fid);
  const r = f.revs ? f.revs[i] : null, nm = safeName((r && r.name) || f.name);
  const fname = f.revs && f.revs.length > 1 ? nm.replace(/(\.[^.]+)?$/, ` (Rev ${revLetter(i)})$1`) : nm;
  return `Files/${safeName(c ? courseLabel(c) : "General")}/${safeName(fo ? fo.name : "Other")}/${fname}`;
}
function deskRevOf(id){
  for (const f of Object.values(state.files)) { const i = (f.revs || []).findIndex(r => r.assetId === id); if (i >= 0) return {f, i}; }
  return null;
}
const deskCandidates = (f, i) => [f.revs[i].localRel, deskMirrorRel(f, i)].filter(Boolean);
async function deskUniqueRel(rel){
  if (!(await DESK.exists(rel))) return rel;
  for (let k = 2; k < 500; k++) { const r = rel.replace(/(\.[^./]+)?$/, ` (${k})$1`); if (!(await DESK.exists(r))) return r; }
  return rel.replace(/(\.[^./]+)?$/, ` (${uid()})$1`);
}
const deskAssets = {
  upload: async (file, o = {}) => {
    const type = o.type || file.type || "application/octet-stream";
    const bytes = new Uint8Array(await file.arrayBuffer());
    const rel = await deskUniqueRel(deskMirrorRel({name: file.name, courseId: o.courseId || "", folderId: o.folderId || "other"}, 0, o.courseId || "", o.folderId || "other"));
    await DESK.write(rel, bytes, o.untrusted || o.origin ? {untrusted: true, origin: o.origin || ""} : undefined);   // saved on this computer first (marked as downloaded when it came from elsewhere)
    let id = "local:" + uid();
    if (sbActive() && cloud.on && navigator.onLine !== false) { try { id = (await sbAssets.upload(file, {type})).id; } catch(e) {} }   // then online, if it can
    deskMarkDone(id);
    return {id, url: "#", sizeBytes: file.size, contentType: type, localRel: rel};
  },
  // Local copies are never removed, only the online copy.
  delete: async id => { if (!/^local:/.test(id) && sbActive()) { try { await sbAssets.delete(id); } catch(e) {} } return {deleted: true}; }
};
let deskPromoting = false;
async function deskPromote(){
  // Files added while offline are uploaded once you're signed in and online.
  if (!DESK || deskPromoting || !sbActive() || !cloud.on || navigator.onLine === false) return;
  deskPromoting = true;
  try {
    let n = 0;
    for (const f of Object.values(state.files)) {
      if (f.kind !== "file" || !(f.revs || []).some(r => /^local:/.test(r.assetId) && r.localRel)) continue;
      const nf = clone(f); let changed = false;
      for (const r of nf.revs) {
        if (!/^local:/.test(r.assetId) || !r.localRel) continue;
        const bytes = await DESK.read(r.localRel); if (!bytes) continue;
        try { const up = await sbAssets.upload(new File([bytes], r.name || f.name, {type: r.type || "application/octet-stream"}), {type: r.type || "application/octet-stream"}); deskMarkDone(up.id); r.assetId = up.id; changed = true; n++; }
        catch(e) { throw e; }
      }
      if (changed) applyChanges([{kind: "file", id: f.id, after: nf}], "");
    }
    if (n) toast(`Uploaded ${n} file${n === 1 ? "" : "s"} added while offline`);
  } catch(e) { /* try again later */ }
  deskPromoting = false;
}
async function deskOpenAsset(id){
  const hit = deskRevOf(id);
  if (hit) {
    for (const rel of deskCandidates(hit.f, hit.i)) if (await DESK.exists(rel)) { const err = await DESK.openFile(rel); if (err) toast("Couldn't open the file: " + err); return; }
    if (/^local:/.test(id)) { toast("That file isn't in the Studyboard folder any more"); return; }
    try {
      toast("Downloading…");
      const bytes = await assetBytes(id), rel = deskMirrorRel(hit.f, hit.i);
      await DESK.write(rel, bytes, {untrusted: true}); deskMarkDone(id);   // marked as downloaded, so Office and the system warn before running macros or programs
      const err = await DESK.openFile(rel); if (err) toast("Couldn't open the file: " + err);
    } catch(e) { toast(navigator.onLine === false ? "You're offline and this file hasn't been saved to this computer yet" : "Couldn't download the file. Try again."); }
  }
}
async function deskChooseFolder(){
  const p = await DESK.chooseDir();
  if (!p) return;
  FSB.where = p; FSB.dir = deskDir("");
  toast(`Studyboard now saves to ${p}`);
  await runFolderBackup(); scheduleRender();
}
async function deskBoot(){
  caps.assets = deskAssets;
  document.body.classList.add("desk"); document.documentElement.classList.add("desk");
  if (DESK.platform === "darwin") document.body.classList.add("mac");
  if (DESK.onFullscreen) DESK.onFullscreen(on => { document.body.classList.toggle("fs", on); deskTint(); const b = dlg.open && dlg.querySelector('[data-act="sbw-fs"]'); if (b) b.textContent = on ? "Exit Full Screen" : "Full Screen"; });
  // The Mac App Store build can ask for a folder at first start (a dialog from main.js); when the window gets focus back, show the new place.
  window.addEventListener("focus", async () => { try { const w = await DESK.dataDir(); if (w && FSB.where && w !== FSB.where) { FSB.where = w; scheduleRender(); } } catch(e) {} });
  // A fresh install (or a cleared app) starts from the copy in the Studyboard folder.
  let has = false; try { has = !!localStorage.getItem(LS2); } catch(e) {}
  if (has) { try { const b = await DESK.read("studyboard-latest.json"); if (b) { const f = JSON.parse(new TextDecoder().decode(b)); if (f && f.app === "studyboard" && Array.isArray(f.tasks)) deskFolderCopy = f; } } catch(e) {} }   // compared in loadLocal
  if (!has) { try { const b = (await DESK.read("studyboard-latest.json")) || (await DESK.read("studioso-latest.json")); if (b) { const t = new TextDecoder().decode(b), f = JSON.parse(t); localStorage.setItem(LS2, t);
    // Remember where this came from and which account wrote it: on sign-in it is checked against the account (claimDevice), never just uploaded
    localStorage.setItem(FOLDER_FROM, f && typeof f.owner === "string" && f.owner ? f.owner.slice(0, 80) : "?"); } } catch(e) { console.warn("No local copy to restore", e); } }
  DESK.onFlush(async () => {
    clearTimeout(FSB.timer);
    for (let k = 0; k < 40 && FSB.busy; k++) await sleep(100);
    try { await runFolderBackup(); } catch(e) {}
    DESK.flushed();
  });
  deskTint();
}

