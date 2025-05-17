const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(event, ...args)),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
  },
  fileSystem: {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    saveFile: (content, suggestedName) => ipcRenderer.invoke('dialog:saveFile', content, suggestedName),
    newFile: () => ipcRenderer.invoke('dialog:newFile')
  }
});
