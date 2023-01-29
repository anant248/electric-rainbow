const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  onUpdateUI: (callback) => ipcRenderer.on("raspberry-pi-data", callback),
  sendImage: (image) => ipcRenderer.send("send-image", image),
});
