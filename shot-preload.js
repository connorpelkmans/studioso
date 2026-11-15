// The screenshot picker's only way to talk to the app
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("studyboardShot", {
  // mode: "calc" when the calculator asked (read an equation), "" for Screenshot to Studyboard
  onInit: fn => ipcRenderer.on("shot:init", (e, url, mode) => { if (typeof url === "string" && url.startsWith("data:image/")) fn(url, mode === "calc" ? "calc" : ""); }),
  done: r => ipcRenderer.send("shot:done", r && typeof r === "object" ? { x: Number(r.x), y: Number(r.y), w: Number(r.w), h: Number(r.h) } : null),
  cancel: () => ipcRenderer.send("shot:cancel")
});
