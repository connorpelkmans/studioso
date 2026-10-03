// Studyboard desktop app (formerly Studioso): a window around the Studyboard page, with a real folder on this computer
// for your data, backups and files. Sync with your account happens inside the page (Supabase).
// Since 1.11: a tray icon, native reminders that keep working with the window closed, and the Today widget.
const { app, BrowserWindow, ipcMain, dialog, shell, protocol, net, Menu, nativeTheme, Tray, Notification, nativeImage, powerMonitor, screen, session, safeStorage } = require("electron");
const path = require("path");
const fs = require("fs");
const fsp = fs.promises;
const { pathToFileURL } = require("url");

const APP_DIR = path.join(__dirname, "app");
const WIDGET_DIR = path.join(__dirname, "widget");
const ICON = path.join(__dirname, "build", process.platform === "win32" ? "icon.ico" : "icon.png");
const LOGIN_ARGS = ["--background"];
protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);

// ---------- Security baseline (Apple App Store / notarization review, see APP-STORE-CHECKLIST.md) ----------
// Every window is sandboxed, isolated, and only ever shows Studyboard's own pages (app://studioso/ and app://widget/).
// Anything else opens in the person's browser after a check (https or mailto only). Permissions are denied unless listed here.
const IS_MAS = !!process.mas;                          // Mac App Store build (sandboxed, no auto-update, no login-item API)
const IS_DEV = !app.isPackaged;
const MAIN_ORIGIN = "app://studioso", WIDGET_ORIGIN = "app://widget";
const ALLOWED_PERMISSIONS = new Set(["notifications", "clipboard-sanitized-write", "fullscreen"]);   // only what Studyboard uses
if (!process.argv.includes("--no-sandbox")) app.enableSandbox();   // sandbox every renderer, even ones created without webPreferences.sandbox (the flag exists only so tests can run as root in a container)
// A link is only ever handed to the operating system when it is a plain https page or a mailto address.
function safeExternal(raw) {
  try {
    const s = String(raw || "");
    if (!s || s.length > 4096) return null;
    const u = new URL(s);
    if (u.protocol === "https:") {
      if (u.username || u.password) return null;
      // App Store rule 3.1.1: the Mac App Store build never sends people to an outside payment page (Pro is bought with Apple's in-app purchase there).
      if (IS_MAS && /(^|\.)(stripe\.com|paypal\.com|paypal\.me|paddle\.com|lemonsqueezy\.com|gumroad\.com|ko-fi\.com|buymeacoffee\.com|patreon\.com)$/i.test(u.hostname)) return null;
      return u.href;
    }
    if (u.protocol === "mailto:") return /^mailto:[^\s<>"']{1,1000}$/i.test(u.href) ? u.href : null;
  } catch (e) {}
  return null;
}
function openExternalSafe(raw) { const u = safeExternal(raw); if (u) shell.openExternal(u).catch(() => {}); return !!u; }
// webSecurity and the other safe defaults are never switched off; devTools only exists when running from source.
const SAFE_PREFS = { contextIsolation: true, nodeIntegration: false, nodeIntegrationInWorker: false, nodeIntegrationInSubFrames: false, sandbox: true, webSecurity: true,
  allowRunningInsecureContent: false, experimentalFeatures: false, webviewTag: false, navigateOnDragDrop: false, safeDialogs: true, devTools: IS_DEV };
const isAppUrl = (raw, origin) => { try { const u = new URL(String(raw)); return u.protocol === "app:" && (origin ? u.origin === origin || ("app://" + u.host) === origin : u.host === "studioso" || u.host === "widget"); } catch (e) { return false; } };

// ---------- Moving over from the Studioso name ----------
// App data (sign-in, settings, the working copy) moves from ...\Studioso to ...\Studyboard the first time Studyboard runs.
// The old folder is left in place, so nothing is ever lost.
(function migrateAppData() {
  try {
    const appData = app.getPath("appData");
    const oldUD = path.join(appData, "Studioso"), newUD = path.join(appData, "Studyboard");
    if (fs.existsSync(path.join(oldUD, "Local Storage")) && !fs.existsSync(path.join(newUD, "Local Storage"))) {
      fs.mkdirSync(newUD, { recursive: true });
      for (const name of fs.readdirSync(oldUD)) {
        if (/^(Singleton|lockfile)/i.test(name)) continue;
        try { fs.cpSync(path.join(oldUD, name), path.join(newUD, name), { recursive: true, force: false, errorOnExist: false }); } catch (e) {}
      }
    }
  } catch (e) {}
})();

// One copy at a time. A second launch just brings the first one forward (and passes along any studyboard:// link).
const GOT_LOCK = app.requestSingleInstanceLock();
if (!GOT_LOCK) { app.quit(); }
app.setAppUserModelId("com.studioso.app");

// ---------- Deep links: studyboard://open?task=ID and studyboard://action/NAME ----------
// Nothing else is accepted. The link can only ask the app to open a task or one of its own screens, never to run, read or write anything.
const DEEP_SCHEME = "studyboard";
function parseDeepLink(raw) {
  try {
    const s = String(raw || "");
    if (s.length > 600) return null;
    const u = new URL(s);
    if (u.protocol !== DEEP_SCHEME + ":" || u.username || u.password || u.port) return null;
    if (u.host === "open") {
      const id = u.searchParams.get("task");
      return id && /^[\w.:-]{1,200}$/.test(id) ? { type: "task", id } : { type: "main" };
    }
    if (u.host === "action") {
      const name = u.pathname.replace(/^\/+|\/+$/g, "");
      return ["quickadd", "today", "focus", "search", "flashcards", "settings"].includes(name) ? { type: "action", name } : null;
    }
  } catch (e) {}
  return null;
}
let pendingDeepLink = null;
function handleDeepLink(raw) {
  const d = parseDeepLink(raw);
  if (!d) return false;
  if (!app.isReady()) { pendingDeepLink = raw; return true; }
  if (d.type === "task") openTask(d.id); else if (d.type === "action") sendAction(d.name); else showMain();
  return true;
}
try {
  // Not in the Mac App Store build (it registers the scheme through Info.plist) and not when running from source.
  if (app.isPackaged && !IS_MAS) {
    if (process.defaultApp && process.argv.length >= 2) app.setAsDefaultProtocolClient(DEEP_SCHEME, process.execPath, [path.resolve(process.argv[1])]);
    else app.setAsDefaultProtocolClient(DEEP_SCHEME);
  }
} catch (e) {}
app.on("open-url", (e, url) => { e.preventDefault(); handleDeepLink(url); });          // macOS

// ---------- Settings kept next to the app's own data ----------
const cfgPath = () => path.join(app.getPath("userData"), "studyboard-desktop.json");
function readCfg() {
  for (const f of [cfgPath(), path.join(app.getPath("userData"), "studioso-desktop.json")]) { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) {} }
  return {};
}
function writeCfg(c) { try { fs.mkdirSync(path.dirname(cfgPath()), { recursive: true }); fs.writeFileSync(cfgPath(), JSON.stringify(c, null, 2)); } catch (e) {} }
let cfgTimer = null;
function writeCfgSoon() { clearTimeout(cfgTimer); cfgTimer = setTimeout(() => writeCfg(cfg), 400); }
// Small JSON files next to the settings (reminders, the widget's last data). Written whole, then renamed into place.
function readJson(name, fallback) { try { return JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), name), "utf8")); } catch (e) { return fallback; } }
function writeJson(name, obj) {
  try {
    const p = path.join(app.getPath("userData"), name), tmp = p + ".partial";
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(tmp, JSON.stringify(obj)); fs.renameSync(tmp, p);
  } catch (e) {}
}
let cfg = {};
// "Keep Running in the Background" is on unless it was turned off. It needs the tray icon, so there's a way back in.
const bgOn = () => cfg.background !== false && !!tray;
const dataRoot = () => cfg.dataDir || path.join(app.getPath("documents"), "Studyboard");
// Documents\Studioso becomes Documents\Studyboard (renamed in place; copied if it can't be renamed).
function migrateDataFolder() {
  if (cfg.dataDir) return;
  const docs = app.getPath("documents"), oldDir = path.join(docs, "Studioso"), newDir = path.join(docs, "Studyboard");
  try {
    if (!fs.existsSync(oldDir) || fs.existsSync(newDir)) return;
    try { fs.renameSync(oldDir, newDir); }
    catch (e) { fs.cpSync(oldDir, newDir, { recursive: true, force: false, errorOnExist: false }); }
  } catch (e) {}
}

// Every path from the page is relative to the Studyboard folder and can't step outside it.
function resolveRel(rel) {
  if (typeof rel !== "string" && rel != null) throw new Error("Bad path");
  rel = String(rel || "");
  if (rel.length > 1024 || rel.includes("\0")) throw new Error("Bad path");
  const root = path.resolve(dataRoot());
  const p = path.resolve(root, rel.replace(/\\/g, "/"));
  if (p !== root && !p.startsWith(root + path.sep)) throw new Error("Path outside the Studyboard folder");
  // A shortcut (symlink) inside the folder must not lead out of it either: the closest part that exists has to stay inside.
  try {
    let q = p; while (q.length > root.length && !fs.existsSync(q)) q = path.dirname(q);
    const realRoot = fs.realpathSync.native(root), realQ = fs.realpathSync.native(q);
    if (realQ !== realRoot && !realQ.startsWith(realRoot + path.sep)) throw new Error("Path outside the Studyboard folder");
  } catch (e) { if (/outside/.test(String(e && e.message))) throw e; }
  return p;
}
// Files Studyboard will open with the computer's default app. Anything else (programs, scripts, shortcuts) is only shown in its folder,
// so a page can never make the computer run something it wrote.
const OPENABLE = new Set(["pdf", "txt", "md", "rtf", "csv", "tsv", "json", "ics", "png", "jpg", "jpeg", "gif", "webp", "heic", "heif", "bmp", "tif", "tiff",
  "doc", "docx", "ppt", "pptx", "xls", "xlsx", "odt", "ods", "odp", "pages", "numbers", "key", "mp3", "m4a", "wav", "aac", "flac", "ogg", "mp4", "mov", "m4v", "webm", "mkv", "zip"]);
async function openSafely(p) {
  let st; try { st = await fsp.stat(p); } catch (e) { return "Not found"; }
  if (st.isDirectory()) return shell.openPath(p);
  const ext = path.extname(p).slice(1).toLowerCase();
  if (OPENABLE.has(ext)) return shell.openPath(p);
  shell.showItemInFolder(p); return "";
}
async function ensureRoot() {
  await fsp.mkdir(dataRoot(), { recursive: true });
  const readme = path.join(dataRoot(), "README.txt");
  if (!fs.existsSync(readme) || /Studioso app keeps/.test(fs.readFileSync(readme, "utf8"))) await fsp.writeFile(readme, [
    "This folder is where the Studyboard app keeps your things on this computer.",
    "",
    "studyboard-latest.json   Everything in Studyboard, updated a few seconds after each change.",
    "Daily backups\\         One copy per day, the last 90 days.",
    "Files\\                 Every file you've added, sorted by course and folder.",
    "",
    "Studyboard also syncs with your online account when you're signed in and connected.",
    "To restore, open Studyboard, go to Settings, then Import from a Backup File, and pick a file from here."
  ].join("\r\n"));
}

// ---------- Window ----------
let win = null, flushed = false, quitting = false, tray = null, widget = null, pendingMax = false;
function windowState() { const s = cfg.window || {}; return { width: s.width || 1320, height: s.height || 860, x: s.x, y: s.y, maximized: !!s.maximized }; }
function saveWindowState() {
  if (!win || win.isDestroyed()) return;
  const b = win.getNormalBounds();
  cfg.window = { width: b.width, height: b.height, x: b.x, y: b.y, maximized: win.isMaximized() }; writeCfg(cfg);
}
function spine() { return nativeTheme.shouldUseDarkColors ? "#060F24" : "#0E2A56"; }
function createWindow(hidden) {
  flushed = false;
  listening.clear();
  const st = windowState();
  win = new BrowserWindow({
    width: st.width, height: st.height, x: st.x, y: st.y, minWidth: 420, minHeight: 560,
    title: "Studyboard", icon: ICON,
    backgroundColor: spine(), show: false,
    titleBarStyle: "hidden",
    trafficLightPosition: { x: 14, y: 10 },
    titleBarOverlay: process.platform === "darwin" ? undefined : { color: spine(), symbolColor: "#FFFFFF", height: 34 },
    webPreferences: { ...SAFE_PREFS, preload: path.join(__dirname, "preload.js"), additionalArguments: ["--studioso-version=" + app.getVersion(), "--studioso-store=" + (IS_MAS ? "mas" : "direct")], spellcheck: true }
  });
  // Started at sign-in: the page loads out of sight (so reminders, sync and the widget work) until you open it.
  if (st.maximized) { if (hidden) pendingMax = true; else win.maximize(); }
  win.once("ready-to-show", () => { if (!hidden) win.show(); });
  win.webContents.on("did-start-loading", () => listening.clear());
  win.loadURL("app://studioso/index.html");
  // Links open in your normal browser; the app window only ever shows Studyboard.
  // (The same rules apply to every window of the default session through lockWebContents below.)
  win.webContents.setWindowOpenHandler(({ url }) => { openExternalSafe(url); return { action: "deny" }; });
  win.webContents.on("will-navigate", (e, url) => { if (!isAppUrl(url, MAIN_ORIGIN)) { e.preventDefault(); openExternalSafe(url); } });
  win.on("resize", saveWindowState); win.on("move", saveWindowState);
  // Give the page a moment to write its latest copy to the Studyboard folder before closing.
  win.on("close", e => {
    saveWindowState();
    // Keep Running in the Background: closing only hides the window, so reminders, sync and the widget carry on.
    if (!quitting && bgOn()) { e.preventDefault(); win.hide(); backgroundTip(); return; }
    if (flushed) return;
    e.preventDefault();
    win.webContents.send("app:flush");
    setTimeout(finishClose, 5000);
  });
  // Windows is signing out or shutting down: let the window close normally so it never holds that up.
  win.on("query-session-end", () => { quitting = true; });
  win.on("session-end", () => { quitting = true; });
  win.on("closed", () => {
    win = null; listening.clear();
    // Background mode off: closing the window ends Studyboard, even if the widget is open (a Mac keeps it in the Dock as usual).
    if (!quitting && !bgOn() && process.platform !== "darwin") app.quit();
  });
}
function showMain() {
  if (!win || win.isDestroyed()) { createWindow(false); return; }
  if (win.isMinimized()) win.restore();
  if (!win.isVisible()) win.show();
  if (pendingMax) { pendingMax = false; win.maximize(); }
  win.focus();
}
function backgroundTip() {
  if (cfg.bgTipShown) return;
  cfg.bgTipShown = true; writeCfg(cfg);
  showNote({ title: "Studyboard Is Still Running", body: `Reminders and the Today widget keep working. Open Studyboard from its icon in the ${process.platform === "darwin" ? "menu bar" : "notification area"}, or turn this off in Settings, Widgets and Desktop.` });
}

// ---------- Messages to the page ----------
// The page says which messages it's ready for (see preload.js). Until then they wait here, for example
// when a reminder is clicked while the window is still opening.
const PAGE_CHANNELS = ["desk:action", "desk:open-task"];
const listening = new Set();
let pendingMsgs = [];
function toPage(channel, ...args) {
  if (win && !win.isDestroyed() && listening.has(channel)) { win.webContents.send(channel, ...args); return; }
  pendingMsgs = pendingMsgs.filter(m => Date.now() - m.at < 120000).slice(-19);
  pendingMsgs.push({ channel, args, at: Date.now() });
  if (!win || win.isDestroyed()) createWindow(true);
}
// An IPC message is only believed when it comes from the top frame of our own window, showing our own page.
const frameUrl = e => { try { return String((e.senderFrame && e.senderFrame.url) || ""); } catch (err) { return ""; } };
const topFrame = e => { try { return !!e.senderFrame && e.senderFrame === e.sender.mainFrame; } catch (err) { return false; } };
const fromMain = e => !!(win && !win.isDestroyed() && e.sender === win.webContents && topFrame(e) && isAppUrl(frameUrl(e), MAIN_ORIGIN));
const fromWidget = e => !!(widget && !widget.isDestroyed() && e.sender === widget.webContents && topFrame(e) && isAppUrl(frameUrl(e), WIDGET_ORIGIN));
ipcMain.on("desk:listen", (e, channel) => {
  if (!fromMain(e) || !PAGE_CHANNELS.includes(channel)) return;
  listening.add(channel);
  const now = pendingMsgs.filter(m => m.channel === channel && Date.now() - m.at < 120000);
  pendingMsgs = pendingMsgs.filter(m => m.channel !== channel);
  for (const m of now) e.sender.send(m.channel, ...m.args);
});
// Actions the page knows how to do (see the widgets module): open quick add, a page, the focus timer, or check off a task.
const ACTIONS = ["quickadd", "today", "focus", "search", "flashcards", "toggle", "focus-task", "settings"];
function sendAction(action, arg, stayHidden) {
  if (!ACTIONS.includes(action)) return;
  if (!stayHidden) showMain();
  toPage("desk:action", action, typeof arg === "string" ? arg.slice(0, 200) : "");
}
function openTask(id) { showMain(); toPage("desk:open-task", String(id).slice(0, 200)); }

// ---------- Small checks for anything that comes from a page ----------
const str = (v, max) => typeof v === "string" ? v.slice(0, max) : "";
const cssColor = v => typeof v === "string" && v.length <= 80 && /^[#(),.%\w\s-]+$/.test(v) ? v.trim() : "";
const cssFont = v => typeof v === "string" && v.length <= 300 && /^[\w\s"',.-]+$/.test(v) ? v.trim() : "";
const int = (v, max) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));

// ---------- Tray icon (Windows notification area, Mac menu bar) ----------
function trayImage() {
  let img = nativeImage.createFromPath(ICON);
  if (img.isEmpty()) return img;
  if (process.platform === "darwin") img = img.resize({ width: 18, height: 18, quality: "best" });
  else if (process.platform !== "win32") img = img.resize({ width: 24, height: 24, quality: "best" });
  return img;
}
function createTray() {
  try { tray = new Tray(trayImage()); } catch (e) { tray = null; return; }
  tray.setToolTip("Studyboard");
  // Windows: a click opens Studyboard and a right-click shows the menu. Mac and Linux show the menu on click.
  if (process.platform === "win32") tray.on("click", () => showMain());
  updateTray();
}
const clock = ms => new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
function updateTray() {
  if (!tray) return;
  const paused = remindersPaused();
  tray.setToolTip(paused ? `Studyboard (reminders paused until ${clock(cfg.pauseUntil)})` : "Studyboard");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Open Studyboard", click: () => showMain() },
    { label: "Quick Add Task", click: () => sendAction("quickadd") },
    { label: "Show Today Widget", type: "checkbox", checked: !!(widget && !widget.isDestroyed()), click: m => setWidgetShown(m.checked) },
    { type: "separator" },
    paused ? { label: `Reminders Paused Until ${clock(cfg.pauseUntil)}`, enabled: false } : null,
    paused ? { label: "Resume Reminders", click: () => resumeReminders() } : { label: "Pause Reminders for 1 Hour", click: () => pauseReminders(60) },
    { type: "separator" },
    { label: "Quit Studyboard", click: () => app.quit() }
  ].filter(Boolean)));
}

// ---------- Native notifications ----------
// Kept in a list while on screen: Windows drops the click handler of a notification that's been garbage collected.
const liveNotes = [];
function showNote({ title, body, taskId }) {
  try {
    if (!Notification.isSupported()) return false;
    const n = new Notification({ title: str(title, 200) || "Studyboard", body: str(body, 1000), icon: process.platform === "darwin" ? undefined : ICON });
    const drop = () => { const i = liveNotes.indexOf(n); if (i >= 0) liveNotes.splice(i, 1); };
    n.on("click", () => { drop(); if (taskId) openTask(taskId); else showMain(); });
    n.on("close", drop);
    n.on("failed", drop);
    liveNotes.push(n); if (liveNotes.length > 60) liveNotes.shift();
    n.show();
    return true;
  } catch (e) { return false; }
}

// ---------- Reminders ----------
// The page hands over its whole list with setReminders. It's saved to disk, so reminders still come after a restart
// or with the window closed. Each reminder (its id and time) is marked as shown before it appears, so it never shows twice.
const REM_FILE = "studyboard-reminders.json";
const LATE_OK = 6 * 3600000;               // a reminder missed while the computer was off still shows if it's under 6 hours late
let rem = { list: [], fired: {}, missed: [] }, remTimer = null, pauseTimer = null;
const remKey = r => r.id + "@" + r.at;
function cleanReminders(list) {
  if (!Array.isArray(list)) return [];
  const out = [], seen = new Set();
  for (const r of list.slice(0, 1000)) {
    if (!r || typeof r !== "object") continue;
    const id = str(r.id, 200), at = Number(r.at);
    if (!id || seen.has(id) || !Number.isFinite(at) || at < 1e12 || at > 1e13) continue;
    seen.add(id);
    out.push({ id, at: Math.round(at), title: str(r.title, 200) || "Studyboard", body: str(r.body, 1000), taskId: str(r.taskId, 200) });
  }
  return out;
}
function loadReminders() {
  const r = readJson(REM_FILE, {});
  rem.list = cleanReminders(r.list);
  rem.fired = r.fired && typeof r.fired === "object" && !Array.isArray(r.fired) ? r.fired : {};
  rem.missed = Array.isArray(r.missed) ? r.missed.slice(-50) : [];
}
function saveReminders() {
  // Forget shown reminders after two weeks unless they're still in the list.
  const keep = new Set(rem.list.map(remKey)), old = Date.now() - 14 * 864e5;
  for (const k of Object.keys(rem.fired)) if (!keep.has(k) && !(rem.fired[k] > old)) delete rem.fired[k];
  writeJson(REM_FILE, rem);
}
const remindersPaused = () => (Number(cfg.pauseUntil) || 0) > Date.now();
function checkReminders() {
  clearTimeout(remTimer);
  const now = Date.now(), due = [];
  let next = Infinity;
  for (const r of rem.list) {
    if (rem.fired[remKey(r)]) continue;
    if (r.at <= now) due.push(r); else next = Math.min(next, r.at);
  }
  if (due.length) {
    for (const r of due) rem.fired[remKey(r)] = now;
    const fresh = due.filter(r => now - r.at <= LATE_OK).sort((a, b) => a.at - b.at);
    if (remindersPaused()) rem.missed = rem.missed.concat(fresh.map(r => ({ title: r.title, body: r.body, taskId: r.taskId }))).slice(-50);
    saveReminders();                          // saved before anything shows
    if (!remindersPaused()) showReminders(fresh);
  }
  // Wake at least every 10 minutes, so sleep and clock changes can't make a reminder late.
  remTimer = setTimeout(checkReminders, Math.max(500, Math.min(next - Date.now(), 600000)));
}
function showReminders(list) {
  if (!list.length) return;
  if (list.length <= 3) { list.forEach(r => showNote(r)); return; }
  showNote({ title: `${list.length} Reminders`, body: list.slice(0, 4).map(r => r.title).join(", ") + (list.length > 4 ? ` and ${list.length - 4} more` : "") });
}
function pauseReminders(minutes) {
  cfg.pauseUntil = Date.now() + minutes * 60000; writeCfg(cfg);
  clearTimeout(pauseTimer); pauseTimer = setTimeout(resumeReminders, minutes * 60000);
  updateTray();
}
function resumeReminders() {
  clearTimeout(pauseTimer);
  cfg.pauseUntil = 0; writeCfg(cfg);
  const missed = rem.missed; rem.missed = []; saveReminders();
  if (missed.length === 1) showNote(missed[0]);
  else if (missed.length) showNote({ title: `${missed.length} Reminders While You Were Paused`, body: missed.slice(0, 4).map(r => r.title).join(", ") + (missed.length > 4 ? ` and ${missed.length - 4} more` : "") });
  updateTray();
  checkReminders();
}
ipcMain.handle("rem:set", (e, list) => {
  if (!fromMain(e)) return false;
  rem.list = cleanReminders(list);
  saveReminders(); checkReminders();
  return rem.list.length;
});
ipcMain.handle("rem:notify", (e, o) => {
  if (!fromMain(e) || !o || typeof o !== "object" || remindersPaused()) return false;
  return showNote({ title: o.title, body: o.body, taskId: str(o.taskId, 200) });
});

// ---------- Today widget ----------
// A small window of its own (widget/widget.html) that shows what the page sends with setWidgetData.
// Checking a task off there is sent back to the page, which changes it the normal way (sync, undo, celebrations).
const WIDGET_FILE = "studyboard-widget.json";
let widgetData = null, widgetSaveTimer = null;
function cleanWidgetData(d) {
  if (!d || typeof d !== "object") return null;
  const task = t => t && typeof t === "object" && str(t.id, 200) ? { id: str(t.id, 200), title: str(t.title, 200), course: str(t.course, 80), color: cssColor(t.color), meta: str(t.meta, 120), done: !!t.done, late: !!t.late } : null;
  const th = d.theme && typeof d.theme === "object" ? d.theme : {};
  const theme = { dark: !!th.dark, font: cssFont(th.font), display: cssFont(th.display) };
  for (const k of ["bg", "surface", "ink", "muted", "line", "soft", "accent", "accentInk", "late", "spine", "spineInk", "tomato"]) theme[k] = cssColor(th[k]);
  const n = d.next && typeof d.next === "object" ? task(d.next) : null;
  if (n) { n.why = str(d.next.why, 160); n.mins = int(d.next.mins, 600); }
  return {
    day: str(d.day, 10), dateLabel: str(d.dateLabel, 60), next: n,
    tasks: (Array.isArray(d.tasks) ? d.tasks.slice(0, 40) : []).map(task).filter(Boolean),
    more: int(d.more, 9999), cards: int(d.cards, 99999), streak: { cur: int(d.streak && d.streak.cur, 99999), today: !!(d.streak && d.streak.today) },
    theme, at: Date.now()
  };
}
function widgetState() { const w = cfg.widget || {}; return { show: !!w.show, pinned: !!w.pinned, x: w.x, y: w.y, width: w.width || 320, height: w.height || 420 }; }
// Put the widget back where it was, or in the top right corner if that screen isn't connected any more.
function widgetBounds() {
  const s = widgetState(), w = Math.max(260, Math.min(640, s.width)), h = Math.max(300, Math.min(900, s.height));
  if (Number.isFinite(s.x) && Number.isFinite(s.y)) {
    const onScreen = screen.getAllDisplays().some(d => { const a = d.workArea; return s.x + 60 > a.x && s.x + w - 60 < a.x + a.width && s.y >= a.y - 10 && s.y + 40 < a.y + a.height; });
    if (onScreen) return { x: s.x, y: s.y, width: w, height: h };
  }
  const a = screen.getPrimaryDisplay().workArea;
  return { x: a.x + a.width - w - 24, y: a.y + 24, width: w, height: h };
}
function widgetBg() { const c = widgetData && widgetData.theme && widgetData.theme.surface; return /^#[0-9a-f]{3,8}$/i.test(c || "") ? c : (nativeTheme.shouldUseDarkColors ? "#1A1F28" : "#FFFFFF"); }
function createWidget() {
  if (widget && !widget.isDestroyed()) { widget.showInactive(); return; }
  const s = widgetState();
  widget = new BrowserWindow({
    ...widgetBounds(), minWidth: 260, minHeight: 300, maxWidth: 640, maxHeight: 900,
    frame: false, resizable: true, maximizable: false, minimizable: false, fullscreenable: false, skipTaskbar: true,
    alwaysOnTop: s.pinned, show: false, title: "Studyboard Today", icon: ICON, backgroundColor: widgetBg(), roundedCorners: true,
    webPreferences: { ...SAFE_PREFS, preload: path.join(WIDGET_DIR, "widget-preload.js"), spellcheck: false }
  });
  if (s.pinned) widget.setAlwaysOnTop(true, "floating");
  widget.once("ready-to-show", () => { if (widget && !widget.isDestroyed()) widget.showInactive(); });
  widget.loadURL("app://widget/widget.html");
  widget.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  widget.webContents.on("will-navigate", e => e.preventDefault());
  widget.webContents.on("will-redirect", e => e.preventDefault());
  const keep = () => {
    if (!widget || widget.isDestroyed()) return;
    const b = widget.getBounds();
    cfg.widget = Object.assign({}, cfg.widget, { x: b.x, y: b.y, width: b.width, height: b.height }); writeCfgSoon();
  };
  widget.on("move", keep); widget.on("resize", keep);
  widget.on("closed", () => { widget = null; updateTray(); });
  updateTray();
}
function setWidgetShown(on) {
  cfg.widget = Object.assign({}, cfg.widget, { show: !!on }); writeCfg(cfg);
  if (on) createWidget(); else if (widget && !widget.isDestroyed()) widget.close();
  updateTray();
}
function setWidgetPinned(on) {
  cfg.widget = Object.assign({}, cfg.widget, { pinned: !!on }); writeCfg(cfg);
  if (widget && !widget.isDestroyed()) { widget.setAlwaysOnTop(!!on, "floating"); widget.webContents.send("widget:pinned", !!on); }
}
function sendWidgetData() {
  if (!widget || widget.isDestroyed()) return;
  widget.webContents.send("widget:data", widgetData);
  try { widget.setBackgroundColor(widgetBg()); } catch (e) {}
}
ipcMain.on("widget:set", (e, d) => {
  if (!fromMain(e)) return;
  const clean = cleanWidgetData(d); if (!clean) return;
  widgetData = clean; sendWidgetData();
  clearTimeout(widgetSaveTimer); widgetSaveTimer = setTimeout(() => writeJson(WIDGET_FILE, widgetData), 2000);
});
ipcMain.on("widget:ready", e => { if (fromWidget(e)) { e.sender.send("widget:pinned", widgetState().pinned); e.sender.send("widget:data", widgetData); } });
ipcMain.on("widget:toggle", (e, id) => { if (fromWidget(e) && str(id, 200)) sendAction("toggle", id, true); });
ipcMain.on("widget:open", (e, what, id) => {
  if (!fromWidget(e)) return;
  if (what === "task" && str(id, 200)) openTask(id);
  else if (what === "focus-task" && str(id, 200)) sendAction("focus-task", id);
  else if (["quickadd", "flashcards", "today"].includes(what)) sendAction(what);
  else showMain();
});
ipcMain.on("widget:pin", (e, on) => { if (fromWidget(e)) setWidgetPinned(on === true); });
ipcMain.on("widget:hide", e => { if (fromWidget(e)) setWidgetShown(false); });

// ---------- Desktop settings for the page (Settings, Widgets and Desktop) ----------
const canLogin = () => process.platform === "win32" || (process.platform === "darwin" && !IS_MAS);   // the Mac App Store build has no start-at-login (it would need a separate helper app)
function loginOn() { try { return canLogin() && !!app.getLoginItemSettings(process.platform === "win32" ? { args: LOGIN_ARGS } : undefined).openAtLogin; } catch (e) { return false; } }
function deskSettings() {
  return { background: cfg.background !== false, tray: !!tray, openAtLogin: loginOn(), canLogin: canLogin(), widget: !!(widget && !widget.isDestroyed()), widgetPinned: widgetState().pinned, pausedUntil: remindersPaused() ? cfg.pauseUntil : 0, notifications: Notification.isSupported() };
}
ipcMain.handle("desk:settings:get", e => fromMain(e) ? deskSettings() : null);
ipcMain.handle("desk:settings:set", (e, key, value) => {
  if (!fromMain(e)) return null;
  if (!["background", "openAtLogin", "widget", "widgetPinned", "pauseReminders"].includes(key)) return deskSettings();
  const on = value === true;
  if (key === "background") { cfg.background = on; writeCfg(cfg); }
  else if (key === "openAtLogin" && canLogin() && !IS_MAS) { try { app.setLoginItemSettings({ openAtLogin: on, args: LOGIN_ARGS }); } catch (err) {} }
  else if (key === "widget") setWidgetShown(on);
  else if (key === "widgetPinned") setWidgetPinned(on);
  else if (key === "pauseReminders") { const m = int(value, 24 * 60); if (m) pauseReminders(m); else resumeReminders(); }
  return deskSettings();
});

// ---------- Folder access for the page ----------
ipcMain.handle("dir:get", e => fromMain(e) ? dataRoot() : null);
ipcMain.handle("dir:open", async (e, rel) => { if (!fromMain(e)) return "denied"; await ensureRoot(); return openSafely(resolveRel(rel || "")); });
ipcMain.handle("dir:choose", async e => {
  if (!fromMain(e)) return null;
  // In the Mac App Store build the chosen folder is remembered with a security-scoped bookmark, or access would end at the next launch.
  const r = await dialog.showOpenDialog(win, { title: "Choose where Studyboard keeps your things", defaultPath: dataRoot(), properties: ["openDirectory", "createDirectory"], buttonLabel: "Use This Folder", securityScopedBookmarks: IS_MAS });
  if (r.canceled || !r.filePaths[0]) return null;
  if (IS_MAS && r.bookmarks && r.bookmarks[0]) { cfg.dataDirBookmark = r.bookmarks[0]; startBookmarkAccess(); }
  let target = r.filePaths[0];
  if (!/^(studyboard|studioso)$/i.test(path.basename(target))) target = path.join(target, "Studyboard");
  const old = dataRoot();
  if (path.resolve(target) === path.resolve(old)) return target;
  await fsp.mkdir(target, { recursive: true });
  // Bring everything along (nothing is deleted from the old folder).
  try { await fsp.cp(old, target, { recursive: true, force: false, errorOnExist: false }); } catch (e) {}
  cfg.dataDir = target; writeCfg(cfg); await ensureRoot();
  return target;
});
const MAX_WRITE = 1536 * 1024 * 1024;           // one file per call; far above anything Studyboard writes in one piece
ipcMain.handle("fs:mkdir", async (e, rel) => { if (!fromMain(e)) return false; await fsp.mkdir(resolveRel(rel), { recursive: true }); return true; });
ipcMain.handle("fs:exists", async (e, rel) => { if (!fromMain(e)) return false; try { await fsp.access(resolveRel(rel)); return true; } catch (err) { return false; } });
ipcMain.handle("fs:write", async (e, rel, data) => {
  if (!fromMain(e)) return false;
  const isBin = data instanceof Uint8Array || data instanceof ArrayBuffer;
  if (typeof data !== "string" && !isBin) throw new Error("Bad data");
  if ((typeof data === "string" ? Buffer.byteLength(data) : data.byteLength) > MAX_WRITE) throw new Error("File too large");
  const p = resolveRel(rel);
  await fsp.mkdir(path.dirname(p), { recursive: true });
  const tmp = p + ".partial";
  await fsp.writeFile(tmp, typeof data === "string" ? data : Buffer.from(data instanceof ArrayBuffer ? new Uint8Array(data) : data));
  await fsp.rename(tmp, p);                      // never leaves a half-written file behind
  return true;
});
ipcMain.handle("fs:read", async (e, rel) => { if (!fromMain(e)) return null; try { return new Uint8Array(await fsp.readFile(resolveRel(rel))); } catch (err) { return null; } });
ipcMain.handle("fs:list", async (e, rel) => { if (!fromMain(e)) return []; try { return (await fsp.readdir(resolveRel(rel), { withFileTypes: true })).map(d => ({ name: d.name, dir: d.isDirectory() })); } catch (err) { return []; } });
ipcMain.handle("fs:remove", async (e, rel) => {
  if (!fromMain(e)) return false;
  // Only old daily backups are ever removed by Studyboard.
  const p = resolveRel(rel);
  if (!/Daily backups[\\/]+(studioso|studyboard)-\d{4}-\d{2}-\d{2}\.json$/.test(p)) return false;
  try { await fsp.unlink(p); return true; } catch (err) { return false; }
});
ipcMain.handle("fs:open", async (e, rel) => fromMain(e) ? openSafely(resolveRel(rel)) : "denied");
// After the final save: close the window, and finish quitting if that's what was asked (Cmd+Q on a Mac).
function finishClose() { if (flushed) return; flushed = true; if (win && !win.isDestroyed()) win.close(); if (quitting) setTimeout(() => app.quit(), 50); }
ipcMain.on("app:flushed", e => { if (fromMain(e)) finishClose(); });
app.on("before-quit", () => { quitting = true; });
ipcMain.on("app:titlebar", (e, color) => {
  if (!fromMain(e) || !win || process.platform === "darwin" || !/^#[0-9a-f]{3,8}$/i.test(String(color))) return;
  try { win.setTitleBarOverlay({ color, symbolColor: "#FFFFFF" }); win.setBackgroundColor(color); } catch (err) {}
});

// ---------- Brightspace, Canvas and Blackboard (read-only sync of your courses, due dates, grades and announcements) ----------
require("./lms").register(() => win, fromMain);

// ---------- Secrets (encrypted with the operating system's keychain via safeStorage) ----------
// For things that must not sit in plain text on disk: the page can keep a few named secrets here (for example its AI keys).
// Each one is encrypted with Keychain / DPAPI / libsecret and written to its own file next to the settings.
// If the system has no keychain available the secret is simply not stored (never written as plain text).
const SECRET_NAME = /^[a-z0-9:_-]{1,64}$/;
const SECRET_FILE = "studyboard-secrets.json";
const secretsOn = () => { try { return safeStorage.isEncryptionAvailable() && !(process.platform === "linux" && safeStorage.getSelectedStorageBackend && safeStorage.getSelectedStorageBackend() === "basic_text"); } catch (e) { return false; } };
const readSecrets = () => { const o = readJson(SECRET_FILE, {}); return o && typeof o === "object" && !Array.isArray(o) ? o : {}; };
ipcMain.handle("secret:available", e => fromMain(e) && secretsOn());
ipcMain.handle("secret:get", (e, name) => {
  if (!fromMain(e) || typeof name !== "string" || !SECRET_NAME.test(name) || !secretsOn()) return null;
  const b = readSecrets()[name]; if (typeof b !== "string") return null;
  try { return safeStorage.decryptString(Buffer.from(b, "base64")); } catch (err) { return null; }
});
ipcMain.handle("secret:set", (e, name, value) => {
  if (!fromMain(e) || typeof name !== "string" || !SECRET_NAME.test(name) || typeof value !== "string" || value.length > 20000 || !secretsOn()) return false;
  const o = readSecrets();
  try { o[name] = safeStorage.encryptString(value).toString("base64"); } catch (err) { return false; }
  writeJson(SECRET_FILE, o); return true;
});
ipcMain.handle("secret:remove", (e, name) => {
  if (!fromMain(e) || typeof name !== "string" || !SECRET_NAME.test(name)) return false;
  const o = readSecrets(); delete o[name]; writeJson(SECRET_FILE, o); return true;
});

// Mac App Store: a folder the person picked outside the app's own container is only reachable while its bookmark is open.
let stopBookmark = null;
function startBookmarkAccess() {
  if (!IS_MAS || !cfg.dataDirBookmark) return;
  try { if (stopBookmark) stopBookmark(); } catch (e) {}
  try { stopBookmark = app.startAccessingSecurityScopedResource(cfg.dataDirBookmark); } catch (e) { stopBookmark = null; }
  writeCfg(cfg);
}

// ---------- Locking down every window and session ----------
// CSP for Studyboard's own pages. The two inline scripts are allowed by hash (scripts/prepare.js writes the hashes); with no hashes file
// (running from source) inline scripts are allowed so development still works. connect-src allows any https host because the person can
// use their own Supabase server and their own AI provider; nothing else (no http, no frames, no plugins, no form posts) is allowed.
let scriptHashes = null;
function loadScriptHashes() { try { const h = JSON.parse(fs.readFileSync(path.join(APP_DIR, "csp-hashes.json"), "utf8")); scriptHashes = Array.isArray(h) && h.every(x => /^sha256-[A-Za-z0-9+/=]+$/.test(x)) ? h : null; } catch (e) { scriptHashes = null; } }
function appCsp() {
  const scripts = scriptHashes && scriptHashes.length ? scriptHashes.map(h => `'${h}'`).join(" ") : "'unsafe-inline'";
  return ["default-src 'self'", `script-src 'self' ${scripts}`, "worker-src 'self' blob:", "style-src 'self' 'unsafe-inline'", "font-src 'self' data: app://studioso",
    "img-src 'self' data: blob: https:", "media-src 'self' data: blob: https:", "connect-src 'self' https: wss: blob: data:", "object-src 'none'", "base-uri 'none'",
    "form-action 'none'", "frame-src 'none'", "frame-ancestors 'none'"].join("; ");
}
const WIDGET_CSP = "default-src 'none'; script-src 'self'; style-src 'self' app://studioso; font-src app://studioso; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; frame-ancestors 'none'";
function lockSession(ses) {
  // Nothing is allowed unless it is on the list, and only for our own pages.
  ses.setPermissionRequestHandler((wc, permission, cb, details) => cb(ALLOWED_PERMISSIONS.has(permission) && isAppUrl((details && details.requestingUrl) || (wc && wc.getURL()))));
  ses.setPermissionCheckHandler((wc, permission, origin, details) => ALLOWED_PERMISSIONS.has(permission) && isAppUrl((details && (details.requestingUrl || details.embeddingOrigin)) || origin));
  ses.setDevicePermissionHandler(() => false);
  try { ses.setDisplayMediaRequestHandler((req, cb) => cb({})); } catch (e) {}
  // No plain-text network traffic at all (the same promise as Apple's App Transport Security).
  ses.webRequest.onBeforeRequest({ urls: ["http://*/*", "ws://*/*", "ftp://*/*"] }, (d, cb) => cb({ cancel: true }));
  // Defence in depth for the CSP (the app:// handler already sets it on each response).
  ses.webRequest.onHeadersReceived({ urls: ["app://*/*", "file://*/*"] }, (d, cb) => {
    const h = Object.assign({}, d.responseHeaders);
    for (const k of Object.keys(h)) if (/^content-security-policy$/i.test(k)) delete h[k];
    let host = ""; try { host = new URL(d.url).host; } catch (e) {}
    h["Content-Security-Policy"] = [host === "widget" ? WIDGET_CSP : appCsp()];
    cb({ responseHeaders: h });
  });
}
// Every window of the default session: no webviews, no navigation away from our pages, links only out to the browser, no developer tools when packaged.
app.on("web-contents-created", (e, wc) => {
  wc.on("will-attach-webview", ev => ev.preventDefault());
  if (!IS_DEV) wc.on("devtools-opened", () => { try { wc.closeDevTools(); } catch (err) {} });
  if (wc.session !== session.defaultSession) return;           // the school sign-in windows have their own rules in lms.js
  const guard = (ev, url) => { if (!isAppUrl(url)) { ev.preventDefault(); openExternalSafe(url); } };
  wc.on("will-navigate", guard);
  wc.on("will-redirect", guard);
  wc.on("will-frame-navigate", guard);
  wc.setWindowOpenHandler(({ url }) => { openExternalSafe(url); return { action: "deny" }; });
});

// ---------- Start ----------
app.on("second-instance", (e, argv) => { const link = (argv || []).find(a => typeof a === "string" && a.startsWith(DEEP_SCHEME + "://")); if (!(link && handleDeepLink(link))) showMain(); });
// Opened at sign-in (Windows passes --background; a Mac says so itself): start quietly in the tray.
function openedAtLogin() {
  if (process.argv.includes("--background")) return true;
  try { return process.platform === "darwin" && !!app.getLoginItemSettings().wasOpenedAtLogin; } catch (e) { return false; }
}
if (GOT_LOCK) app.whenReady().then(async () => {
  cfg = readCfg();
  startBookmarkAccess();
  loadScriptHashes();
  lockSession(session.defaultSession);
  migrateDataFolder();
  writeCfg(cfg);
  await ensureRoot();
  protocol.handle("app", async req => {
    try {
      if (req.method !== "GET" && req.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
      const u = new URL(req.url);
      // app://widget/ is the Today widget's own little page; app://studioso/ is the Studyboard page. No other host exists.
      if (u.host !== "widget" && u.host !== "studioso") return new Response("Not found", { status: 404 });
      const dir = u.host === "widget" ? WIDGET_DIR : APP_DIR;
      const rel = decodeURIComponent(u.pathname).replace(/^\/+/, "") || (dir === WIDGET_DIR ? "widget.html" : "index.html");
      if (rel.includes("\0")) return new Response("Not found", { status: 404 });
      const p = path.resolve(dir, rel);
      if (!p.startsWith(dir + path.sep) || (dir === WIDGET_DIR && /preload/i.test(rel)) || (dir === APP_DIR && rel === "csp-hashes.json")) return new Response("Not found", { status: 404 });
      const r = await net.fetch(pathToFileURL(p).toString());
      const h = new Headers(r.headers);
      h.set("X-Content-Type-Options", "nosniff");
      h.set("Referrer-Policy", "no-referrer");
      if (/\.html?$/i.test(rel)) h.set("Content-Security-Policy", dir === WIDGET_DIR ? WIDGET_CSP : appCsp());
      // The widget uses the app's own fonts, which need permission to be read from app://widget/.
      if (dir === APP_DIR && /^vendor\/fonts\//.test(rel)) h.set("Access-Control-Allow-Origin", "app://widget");
      return new Response(r.body, { status: r.status, headers: h });
    } catch (e) { return new Response("Not found", { status: 404 }); }
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform === "darwin" ? [{ role: "appMenu" }] : []),
    { label: "Edit", submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" }] },
    { label: "View", submenu: [{ role: "reload" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { type: "separator" }, { role: "togglefullscreen" }, ...(IS_DEV ? [{ role: "toggleDevTools" }] : [])] },
    { role: "windowMenu" }
  ]));
  createTray();
  loadReminders();
  widgetData = readJson(WIDGET_FILE, null);
  if (remindersPaused()) pauseTimer = setTimeout(resumeReminders, cfg.pauseUntil - Date.now()); else if (cfg.pauseUntil) resumeReminders();
  createWindow(openedAtLogin() && bgOn());
  if (widgetState().show) createWidget();
  checkReminders();
  const startLink = pendingDeepLink || process.argv.find(a => typeof a === "string" && a.startsWith(DEEP_SCHEME + "://"));
  pendingDeepLink = null; if (startLink) handleDeepLink(startLink);
  try { powerMonitor.on("resume", checkReminders); powerMonitor.on("unlock-screen", checkReminders); powerMonitor.on("shutdown", () => { quitting = true; }); } catch (e) {}
  app.on("activate", () => showMain());
});
app.on("window-all-closed", () => { if (process.platform !== "darwin" && !bgOn()) app.quit(); });
