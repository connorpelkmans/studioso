/* ===== module: 01-pwa.js: the app's core, installable website, persistent storage, light and dark mode, backup files ===== */
/* Installable website */
let installEvt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; });
function pwaBoot(){
  const links = document.querySelectorAll('link[rel="manifest"]');
  if (inPreview() || DESK || !(location.protocol === "https:" || (location.protocol === "http:" && location.hostname === "localhost"))) { if (inPreview() || DESK) links.forEach(x => x.remove()); return; }
  if (!links.length) { const l = document.createElement("link"); l.rel = "manifest"; l.href = "manifest.webmanifest"; document.head.appendChild(l); }
  else for (let i = 1; i < links.length; i++) links[i].remove();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(e => { if (window.SBERR) SBERR.flow("sw-register", e); });
}
/* Keeping this browser's copy */
const PST = {state: "unknown"};
const nativeShell = () => { try { const C = window.Capacitor; return !!(C && typeof C.isNativePlatform === "function" && C.isNativePlatform()); } catch (e) { return false; } };
async function storageProtect(ask){
  if (DESK || nativeShell()) return (PST.state = "app");
  if (inPreview() || !navigator.storage || typeof navigator.storage.persist !== "function") return (PST.state = "unsupported");
  try {
    if (await navigator.storage.persisted()) PST.state = "granted";
    else PST.state = ask && (await navigator.storage.persist()) ? "granted" : "denied";
  } catch (e) { PST.state = "unknown"; }
  return PST.state;
}
window.addEventListener("appinstalled", () => { storageProtect(true).then(scheduleRender).catch(() => {}); });
function storageRow(){
  const st = PST.state;
  // the iPhone, iPad, Android and desktop apps keep their data themselves: nothing to ask (checked here too, since the
  // first ask happens a few seconds after start-up)
  if (st === "app" || DESK || nativeShell() || inPreview()) return "";
  if (st === "granted") return `<div class="cap-row"><span style="flex:1;font-weight:600">Data Kept Safe on This Device<span class="sub">This browser has agreed never to clear Studyboard's data on its own. Only you can remove it (Clear All Data, or clearing this site's data).</span></span></div>`;
  const safari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent || ""), standalone = !!(window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  const how = st === "unsupported" ? "This browser can't promise to keep website data." : safari && !standalone ? "Safari can clear a website's data after 7 days without a visit. Add Studyboard to your Home Screen (Share, then Add to Home Screen) to stop that." : "Your browser hasn't agreed yet. Installing Studyboard as an app or bookmarking it usually lets it say yes.";
  return `<button data-act="storage-protect"><span>Protect My Data on This Device<span class="sub">${esc(how)} ${typeof sbUser !== "undefined" && sbUser ? "Your account also keeps a copy." : "Signing in or exporting a backup keeps a second copy."}</span></span></button>`;
}
// Test handle (only when a test page sets window.__SB_TEST)
if (window.__SB_TEST) setTimeout(() => { window.__sbPrivacy = {DEVSECRET, syncSettings, keepLocalFeeds, exportArrays, storageProtect, storageRow, wipeDeviceData,
  get settings(){ return state.settings; }, setSettings: o => { state.settings = Object.assign({}, state.settings, o); }, addTask: t => { state.tasks = Object.assign({}, state.tasks, {[t.id]: t}); },
  sbUrlSessionOk, claimDevice, setState: x => { state = x; }, get aiKeys(){ return aiLocalKeys; }, set aiKeys(k){ aiLocalKeys = k; }}; }, 0);
function installRow(){
  if (inPreview() || DESK || location.protocol !== "https:") return "";
  try { const C = window.Capacitor; if (C && typeof C.isNativePlatform === "function" && C.isNativePlatform()) return ""; } catch (e) {}
  const standalone = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
  if (standalone) return "";
  return installEvt ? `<button data-act="pwa-install"><span>Install Studyboard as an App<span class="sub">Its own icon and window, and it opens without internet</span></span></button>`
    : `<div class="cap-row"><span style="flex:1;font-weight:600">Install as an App<span class="sub">iPhone: Share, then Add to Home Screen. Android or Chrome: menu, then Install app (or Add to Home screen).</span></span></div>`;
}


/* Light and dark mode */
const THEME_KEY = "studioso:theme";
let themeSetByUs = false;
function themePref(){ try { const t = localStorage.getItem(THEME_KEY); return t === "dark" || t === "light" ? t : "system"; } catch(e) { return "system"; } }
const systemDark = () => !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
function isDark(){ const p = themePref(), d = document.documentElement.dataset.theme; return p === "dark" || (p === "system" && (d ? d === "dark" : systemDark())); }
function applyTheme(){
  const p = themePref(), root = document.documentElement;
  if (p === "system") { if (themeSetByUs || root.dataset.theme === "dark" || root.dataset.theme === "light") { if (themeSetByUs || !inPreview()) delete root.dataset.theme; } themeSetByUs = false; }
  else { root.dataset.theme = p; themeSetByUs = true; }
  const dark = isDark();
  $$(".theme-btn").forEach(b => { b.classList.toggle("is-dark", dark); b.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode"); const l = b.querySelector(".tl-l"); if (l) l.textContent = dark ? "Light" : "Dark"; });
  const tc = document.querySelector('meta[name="theme-color"]'); if (window.SBBARTINT && innerWidth < 640) setTimeout(SBBARTINT, 0); else if (tc) tc.setAttribute("content", getComputedStyle(root).getPropertyValue("--spine").trim() || (dark ? "#060F24" : "#0E2A56"));
  if (DESK) setTimeout(deskTint, 30);
}
function setTheme(p){ try { if (p === "system") localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, p); } catch(e) {} applyTheme(); }
// The window buttons' strip matches what's under it
function deskTint(){
  try {
    const wide = innerWidth >= 980;
    const hex = c => { const m = String(c).match(/\d+(\.\d+)?/g); if (!m || m.length < 3) return ""; return "#" + m.slice(0, 3).map(x => Math.round(+x).toString(16).padStart(2, "0")).join(""); };
    let col = wide ? hex(getComputedStyle(document.body).backgroundColor) : "";
    if (!col || col === "#000000" && /,\s*0\)$/.test(getComputedStyle(document.body).backgroundColor)) col = getComputedStyle(document.documentElement).getPropertyValue("--spine").trim() || "#0E2A56";
    const v = parseInt(col.slice(1, 7), 16), lum = ((v >> 16 & 255) * .299 + (v >> 8 & 255) * .587 + (v & 255) * .114) / 255;
    DESK.setTitleBar(col, lum > .6 ? "#1F2937" : "#FFFFFF");
  } catch(e) {}
}
let deskTintT = 0;
if (DESK) window.addEventListener("resize", () => { clearTimeout(deskTintT); deskTintT = setTimeout(deskTint, 150); });
if (window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (themePref() === "system") applyTheme(); });
function themeRow(){
  const p = themePref();
  return `<div class="cap-row"><span style="flex:1;font-weight:600">Appearance<span class="sub">System follows your device's setting</span></span><div class="segb" role="group" aria-label="Appearance">${[["system","System"],["light","Light"],["dark","Dark"]].map(([k, l]) => `<button data-act="theme-set" data-id="${k}" aria-pressed="${p === k}">${l}</button>`).join("")}</div></div>`;
}

/* Backup files */
function saveBlob(filename, data, type){
  const blob = data instanceof Blob ? data : new Blob([data], {type: type || "application/octet-stream"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.style.display = "none";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
const inPreview = () => !!(window.claude && typeof window.claude.use === "function");
// The main backup includes your uploaded files whenever there are any (a ZIP); "data only" skips them
async function exportBackup(opts){
  if (!(opts && opts.dataOnly) && hasStoredFiles()) return exportFullBackup();
  const data = JSON.stringify(Object.assign({app:"studyboard"}, exportArrays()), null, 2);
  try {
    const dl = caps.downloads || await useCap("downloads");
    if (dl) { await dl.save({filename: `studyboard-backup-${todayISO()}.json`, data}); toast("Backup file saved"); return; }
  } catch(e) { if (e && e.code === "declined") return; }
  if (!inPreview()) { saveBlob(`studyboard-backup-${todayISO()}.json`, data, "application/json"); try { localStorage.setItem("studioso:lastExport", String(Date.now())); } catch(e) {} toast("Backup file saved"); scheduleRender(); return; }
  try { await navigator.clipboard.writeText(data); toast("Backup copied to clipboard"); }
  catch(e) { toast("Export isn't available here"); }
}
$("#importFile").addEventListener("change", async e => {
  const f = e.target.files && e.target.files[0]; e.target.value = "";
  if (!f) return;
  const isZip = /\.zip$/i.test(f.name) || f.type === "application/zip";
  if (f.size > (isZip ? 3 * 1024 ** 3 : 200e6)) { toast("That file is too big to be a Studyboard backup"); return; }
  try {
    let entries = null, text;
    if (isZip) {
      entries = unzipStored(await f.arrayBuffer());
      const j = entries.find(x => /(^|\/)(studioso|studyboard)-(backup|export)\.json$/.test(x.name));
      if (!j) throw new Error("no backup in zip");
      if (j.data.length > 200e6) throw new Error("too big");
      text = new TextDecoder().decode(j.data);
    } else text = await f.text();
    const raw = JSON.parse(text), d = fromArrays(raw), has = k => !!raw && Array.isArray(raw[k]);
    const cs = has("courses") ? Object.values(d.courses) : Object.values(state.courses), ts = has("tasks") ? Object.values(d.tasks) : Object.values(state.tasks), ns = has("notes") ? Object.values(d.notes) : Object.values(state.notes), ds = has("decks") ? Object.values(d.decks) : Object.values(state.decks || {}), es = has("events") ? Object.values(d.events || {}) : Object.values(state.events || {});
    let fs = has("files") ? Object.values(d.files) : Object.values(state.files);
    if (!cs.length && !ts.length && !ns.length && !fs.length && !ds.length) throw new Error("empty");
    const nFiles = entries ? entries.filter(x => x.name.startsWith("files/")).length : 0;
    confirmSheet("Replace Your Data?", `This backup has ${plural0(cs.length, "course")}, ${plural0(ts.length, "task")}, ${plural0(ns.length, "note")} and ${plural0(ds.length, "flashcard deck")}${nFiles ? `, plus ${nFiles} stored file${nFiles === 1 ? "" : "s"}` : ""}. It will replace everything currently here. You can undo right after.`, "Replace", async () => {
      ui.courseId = null; ui.filter = "all";
      backupBefore("Before importing a backup");
      let msg = "Backup imported";
      if (entries && nFiles) {
        const r = await importBackupFiles(fs, entries);
        fs = r.files;
        msg = `Backup imported with ${r.moved} file${r.moved === 1 ? "" : "s"}${r.skipped ? `, ${r.skipped} couldn't be restored${sbActive() || inPreview() ? "" : " (sign in first)"}` : ""}`;
      }
      applyChanges(replaceAllChanges(cs, ts, fs, ns, ds, es), msg);
      if (d.settings && d.settings.avail !== undefined) { try { availRestore(d.settings.avail); } catch(e) {} }
      if (raw.settings && typeof raw.settings === "object" && !Array.isArray(raw.settings)) restoreSettingsFrom(d.settings, "file");
      if (has("trash")) trashMerge(Object.values(d.trash));
    });
  } catch(err) { toast(/compressed/.test(String(err && err.message)) ? "That zip wasn't made by Studyboard" : "That file isn't a Studyboard backup"); }
});
