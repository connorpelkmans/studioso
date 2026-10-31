// The only things the Studyboard page can do on your computer
const { contextBridge, ipcRenderer } = require("electron");
// Nothing here hands the page ipcRenderer or any Node module
const version = (process.argv.find(a => a.startsWith("--studioso-version=")) || "").split("=")[1] || "";
// "mas" in the Mac App Store build, "msstore" in the Microsoft Store build
const storeArg = (process.argv.find(a => a.startsWith("--studioso-store=")) || "").split("=")[1];
const store = storeArg === "mas" || storeArg === "msstore" ? storeArg : "direct";
const relOk = rel => (typeof rel === "string" ? rel : "").slice(0, 1024);
const secretName = n => String(n || "").toLowerCase().slice(0, 64);
contextBridge.exposeInMainWorld("studiosoDesktop", {
  version,
  store,
  // true in the Mac App Store build
  mas: store === "mas",
  platform: process.platform,
  // Sign in with Google or Apple in the computer's browser: oauthPort() starts the one-time return page (its port, or 0);
  // oauthOpen(url) opens the provider and resolves with the address it returned to, or null
  // Mac App Store build only: Apple's in-app purchase (main.js). products(ids) -> [{id, title, price}]; buy(id, userId) ->
  // {status, message}; restore() -> true; receipt() -> base64
  iap: store === "mas" ? {
    products: ids => ipcRenderer.invoke("iap:products", Array.isArray(ids) ? ids.slice(0, 10).map(String) : []),
    buy: (id, user) => ipcRenderer.invoke("iap:buy", String(id || ""), String(user || "")),
    restore: () => ipcRenderer.invoke("iap:restore"),
    receipt: () => ipcRenderer.invoke("iap:receipt")
  } : null,
  oauthPort: () => ipcRenderer.invoke("auth:port"),
  oauthOpen: url => ipcRenderer.invoke("auth:open", typeof url === "string" ? url.slice(0, 4096) : ""),
  dataDir: () => ipcRenderer.invoke("dir:get"),
  // {path, chosen, inContainer, lost}
  dataDirInfo: () => ipcRenderer.invoke("dir:info"),
  chooseDir: () => ipcRenderer.invoke("dir:choose"),
  openDir: rel => ipcRenderer.invoke("dir:open", relOk(rel)),
  mkdir: rel => ipcRenderer.invoke("fs:mkdir", relOk(rel)),
  exists: rel => ipcRenderer.invoke("fs:exists", relOk(rel)),
  // opts (optional)
  write: (rel, data, opts) => ipcRenderer.invoke("fs:write", relOk(rel), data, opts && typeof opts === "object" ? { untrusted: opts.untrusted === true || opts.origin != null, origin: typeof opts.origin === "string" ? opts.origin.slice(0, 2048) : undefined } : undefined),
  read: rel => ipcRenderer.invoke("fs:read", relOk(rel)),
  list: rel => ipcRenderer.invoke("fs:list", relOk(rel)),
  remove: rel => ipcRenderer.invoke("fs:remove", relOk(rel)),
  openFile: rel => ipcRenderer.invoke("fs:open", relOk(rel)),
  // Secrets kept encrypted by the operating system's keychain (never plain text on disk)
  secrets: {
    available: () => ipcRenderer.invoke("secret:available"),
    get: name => ipcRenderer.invoke("secret:get", secretName(name)),
    set: (name, value) => ipcRenderer.invoke("secret:set", secretName(name), String(value == null ? "" : value)),
    remove: name => ipcRenderer.invoke("secret:remove", secretName(name))
  },
  // A Gemini key or a code from another device on the clipboard, or ""
  aiClipboard: () => ipcRenderer.invoke("clip:aikey"),
  // Tells the desktop app whether "Send Anonymous Crash Reports" is on, so its own
  setCrashReports: on => ipcRenderer.send("crash:set", on === true),
  onFlush: fn => ipcRenderer.on("app:flush", () => fn()),
  flushed: () => ipcRenderer.send("app:flushed"),
  setTitleBar: (color, symbol) => ipcRenderer.send("app:titlebar", String(color || ""), String(symbol || "")),
  fullscreen: on => ipcRenderer.invoke("app:fullscreen", on === undefined ? null : !!on),
  // Printing as a PDF (the page shows its print view first)
  printPdf: o => ipcRenderer.invoke("app:pdf", { mode: o && o.mode === "save" ? "save" : "print", paper: o && o.paper === "a4" ? "a4" : "letter", name: String((o && o.name) || "").slice(0, 120) }),
  openSavedPdf: () => ipcRenderer.invoke("app:pdf-open"),
  onFullscreen: fn => ipcRenderer.on("app:fullscreen", (e, on) => fn(!!on)),
  // 1.11: native reminders
  setReminders: list => ipcRenderer.invoke("rem:set", Array.isArray(list) ? list : []),
  notify: o => ipcRenderer.invoke("rem:notify", o && typeof o === "object" ? { title: o.title, body: o.body, taskId: o.taskId } : {}),
  // fn(taskId): a reminder or the Today widget asks to open a task
  onOpenTask: fn => { ipcRenderer.on("desk:open-task", (e, id) => fn(String(id))); ipcRenderer.send("desk:listen", "desk:open-task"); },
  // fn(action, arg)
  onCapture: fn => { ipcRenderer.on("desk:capture", (e, url) => fn(String(url || "").slice(0, 2400))); ipcRenderer.send("desk:listen", "desk:capture"); },
  // fn(bytes): the part of the screen the person boxed with the screenshot shortcut, as a JPEG
  onScreenshot: fn => { ipcRenderer.on("desk:screenshot", (e, bytes) => { try { fn(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)); } catch (err) {} }); ipcRenderer.send("desk:listen", "desk:screenshot"); },
  // Starts the same screenshot picker as the shortcut (the Try it button in Settings)
  captureScreen: () => ipcRenderer.invoke("shot:now"),
  onAction: fn => { ipcRenderer.on("desk:action", (e, action, arg) => fn(String(action), String(arg || ""))); ipcRenderer.send("desk:listen", "desk:action"); },
  // {onBattery, thermal
  focusBlock: {
    status: () => ipcRenderer.invoke("block:status"),
    start: (sites, minutes) => ipcRenderer.invoke("block:start", (Array.isArray(sites) ? sites : []).slice(0, 40).map(x => String(x || "").slice(0, 120)), Math.max(1, Math.min(360, Number(minutes) || 0))),
    clear: () => ipcRenderer.invoke("block:clear")
  },
  getPower: () => ipcRenderer.invoke("power:get"),
  onPower: fn => { ipcRenderer.on("desk:power", (e, o) => { if (o && typeof o === "object") fn({ onBattery: o.onBattery === true, thermal: String(o.thermal || "unknown"), locked: o.locked === true }); }); ipcRenderer.send("desk:listen", "desk:power"); },
  // What the Today widget shows (built by the widgets module)
  setWidgetData: data => ipcRenderer.send("widget:set", data),
  // {background, tray, openAtLogin, canLogin, widget, widgetPinned, pausedUntil
  getDesktopSettings: () => ipcRenderer.invoke("desk:settings:get"),
  // key: "background" | "openAtLogin" | "widget" | "widgetPinned" (true or false)
  setDesktopSetting: (key, value) => ipcRenderer.invoke("desk:settings:set", String(key), value),
  // Microsoft Store build only
  openStartupSettings: () => ipcRenderer.invoke("desk:startup-settings"),
  mic: what => ipcRenderer.invoke("desk:mic", what === "settings" ? "settings" : "ask"),
  // 1.11: Brightspace, Canvas and Blackboard (id = "brightspace" | "canvas" | "blackboard")
  lms: {
    connect: (id, host) => ipcRenderer.invoke("lms:connect", String(id), String(host || "")),
    sync: (id, host, opts) => ipcRenderer.invoke("lms:sync", String(id), String(host || ""), opts && typeof opts === "object" ? JSON.parse(JSON.stringify(opts)) : {}),
    file: (id, host, spec) => ipcRenderer.invoke("lms:file", String(id), String(host || ""), spec && typeof spec === "object" ? JSON.parse(JSON.stringify(spec)) : {}),
    mail: (id, host, spec) => ipcRenderer.invoke("lms:mail", String(id), String(host || ""), spec && typeof spec === "object" ? JSON.parse(JSON.stringify(spec)) : {}),
    feed: (id, url) => ipcRenderer.invoke("lms:feed", String(id), String(url || "")),
    signOut: id => ipcRenderer.invoke("lms:signout", String(id)),
    ping: (id, host) => ipcRenderer.invoke("lms:ping", String(id), String(host || ""))
  }
});
