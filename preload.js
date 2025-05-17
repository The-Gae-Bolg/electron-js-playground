const { contextBridge, ipcRenderer } = require('electron');

// Configurar los canales de comunicación seguros
const validChannels = [
  'new-file', 'open-file', 'file-saved', 
  'menu-new-file', 'menu-open-file', 'menu-save-file',
  'dialog:openFile', 'dialog:saveFile', 'dialog:newFile'
];

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    on: (channel, func) => {
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    invoke: (channel, ...args) => {
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      return Promise.reject(new Error('Invalid channel'));
    }
  },
  fileSystem: {
    saveFile: (content, filePath) => {
      return ipcRenderer.invoke('dialog:saveFile', content, filePath);
    },
    openFile: () => {
      return ipcRenderer.invoke('dialog:openFile');
    },
    newFile: () => {
      return ipcRenderer.invoke('dialog:newFile');
    }
  }
});
