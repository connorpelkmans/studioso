// The screenshot picker's only way to talk to the app: receive the picture, send back the box or a cancel.
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("studyboardShot", {
  onInit: fn => ipcRenderer.on("shot:init", (e, url) => { if (typeof url === "string" && url.startsWith("data:image/")) fn(url); }),
  done: r => ipcRenderer.send("shot:done", r && typeof r === "object" ? { x: Number(r.x), y: Number(r.y), w: Number(r.w), h: Number(r.h) } : null),
  cancel: () => ipcRenderer.send("shot:cancel")
});
