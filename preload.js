// The only things the Studyboard page can do on your computer: read and write inside the Studyboard folder,
// open files and the folder, pick a different folder, keep a few secrets in the system keychain, show reminders, feed the Today widget and its settings,
// and read (never change) your Brightspace, Canvas or Blackboard.
const { contextBridge, ipcRenderer } = require("electron");
// Nothing here hands the page ipcRenderer or any Node module: every function sends one fixed channel with plain, checked values.
const version = (process.argv.find(a => a.startsWith("--studioso-version=")) || "").split("=")[1] || "";
// "mas" in the Mac App Store build, "direct" otherwise. The page uses it to follow the store's purchase rules (no outside payment links).
const store = (process.argv.find(a => a.startsWith("--studioso-store=")) || "").split("=")[1] === "mas" ? "mas" : "direct";
const relOk = rel => (typeof rel === "string" ? rel : "").slice(0, 1024);
const secretName = n => String(n || "").toLowerCase().slice(0, 64);
contextBridge.exposeInMainWorld("studiosoDesktop", {
  version,
  store,
  mas: store === "mas",
  platform: process.platform,
  mas: !!process.mas,   // true in the Mac App Store build: Pro is then bought with in-app purchase (see PLAN.buy in index.html)
  dataDir: () => ipcRenderer.invoke("dir:get"),
  chooseDir: () => ipcRenderer.invoke("dir:choose"),
  openDir: rel => ipcRenderer.invoke("dir:open", relOk(rel)),
  mkdir: rel => ipcRenderer.invoke("fs:mkdir", relOk(rel)),
  exists: rel => ipcRenderer.invoke("fs:exists", relOk(rel)),
  write: (rel, data) => ipcRenderer.invoke("fs:write", relOk(rel), data),
  read: rel => ipcRenderer.invoke("fs:read", relOk(rel)),
  list: rel => ipcRenderer.invoke("fs:list", relOk(rel)),
  remove: rel => ipcRenderer.invoke("fs:remove", relOk(rel)),
  openFile: rel => ipcRenderer.invoke("fs:open", relOk(rel)),
  // Secrets kept encrypted by the operating system's keychain (never plain text on disk). available() is false when the system has none.
  secrets: {
    available: () => ipcRenderer.invoke("secret:available"),
    get: name => ipcRenderer.invoke("secret:get", secretName(name)),
    set: (name, value) => ipcRenderer.invoke("secret:set", secretName(name), String(value == null ? "" : value)),
    remove: name => ipcRenderer.invoke("secret:remove", secretName(name))
  },
  onFlush: fn => ipcRenderer.on("app:flush", () => fn()),
  flushed: () => ipcRenderer.send("app:flushed"),
  setTitleBar: color => ipcRenderer.send("app:titlebar", color),
  // 1.11: native reminders. list = [{id, at (ms), title, body, taskId}]; the whole list each time. Kept on disk, shown once each.
  setReminders: list => ipcRenderer.invoke("rem:set", Array.isArray(list) ? list : []),
  notify: o => ipcRenderer.invoke("rem:notify", o && typeof o === "object" ? { title: o.title, body: o.body, taskId: o.taskId } : {}),
  // fn(taskId): a reminder or the Today widget asks to open a task.
  onOpenTask: fn => { ipcRenderer.on("desk:open-task", (e, id) => fn(String(id))); ipcRenderer.send("desk:listen", "desk:open-task"); },
  // fn(action, arg): the tray, the widget or a shortcut asks for "quickadd", "today", "focus", "search", "flashcards",
  // "settings", "toggle" (arg = task id) or "focus-task" (arg = task id).
  // fn(url): a studyboard://add?... or studyboard://capture?... link. The page checks it (allowed fields only) and shows a draft.
  onCapture: fn => { ipcRenderer.on("desk:capture", (e, url) => fn(String(url || "").slice(0, 2400))); ipcRenderer.send("desk:listen", "desk:capture"); },
  onAction: fn => { ipcRenderer.on("desk:action", (e, action, arg) => fn(String(action), String(arg || ""))); ipcRenderer.send("desk:listen", "desk:action"); },
  // What the Today widget shows (built by the widgets module).
  setWidgetData: data => ipcRenderer.send("widget:set", data),
  // {background, tray, openAtLogin, canLogin, widget, widgetPinned, pausedUntil, notifications}
  getDesktopSettings: () => ipcRenderer.invoke("desk:settings:get"),
  // key: "background" | "openAtLogin" | "widget" | "widgetPinned" (true or false), or "pauseReminders" (minutes, 0 resumes)
  setDesktopSetting: (key, value) => ipcRenderer.invoke("desk:settings:set", String(key), value),
  // 1.11: Brightspace, Canvas and Blackboard (id = "brightspace" | "canvas" | "blackboard"). Read-only; you sign in on the
  // platform's own page, in a separate private cookie store for each.
  lms: {
    connect: (id, host) => ipcRenderer.invoke("lms:connect", String(id), String(host || "")),
    sync: (id, host, opts) => ipcRenderer.invoke("lms:sync", String(id), String(host || ""), opts && typeof opts === "object" ? JSON.parse(JSON.stringify(opts)) : {}),
    file: (id, host, spec) => ipcRenderer.invoke("lms:file", String(id), String(host || ""), spec && typeof spec === "object" ? JSON.parse(JSON.stringify(spec)) : {}),
    feed: (id, url) => ipcRenderer.invoke("lms:feed", String(id), String(url || "")),
    signOut: id => ipcRenderer.invoke("lms:signout", String(id))
  }
});
