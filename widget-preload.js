// The Today widget can only do these things: receive what the Studyboard page sends it, and ask for a task to be
// checked off or opened, the main window to open, the widget to stay on top, or the widget to close.
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("studyboardWidget", {
  platform: process.platform,
  onData: fn => ipcRenderer.on("widget:data", (e, d) => fn(d)),
  onPinned: fn => ipcRenderer.on("widget:pinned", (e, on) => fn(!!on)),
  ready: () => ipcRenderer.send("widget:ready"),
  toggle: id => ipcRenderer.send("widget:toggle", String(id)),
  open: (what, id) => ipcRenderer.send("widget:open", String(what || "app"), id ? String(id) : ""),
  pin: on => ipcRenderer.send("widget:pin", on === true),
  hide: () => ipcRenderer.send("widget:hide")
});
