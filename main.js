const { app, BrowserWindow, ipcMain, dialog, Menu, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'logo.svg'), // Usa el logo.svg como icono de la app
    webPreferences: {
      nodeIntegration: false, // Cambiado a false por seguridad
      contextIsolation: true, // Activado para usar preload
      preload: path.join(__dirname, 'preload.js'), // Usar preload
      enableRemoteModule: false
    }
  });

  mainWindow.loadFile('index.html');

  // Menú nativo File
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-file');
          }
        },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-open-file');
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save-file');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit'
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomFactor();
            mainWindow.webContents.setZoomFactor(currentZoom + 0.1);
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomFactor();
            mainWindow.webContents.setZoomFactor(currentZoom - 0.1);
          }
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.setZoomFactor(1);
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About',
              message: 'CodePlay JS\nVersion 1.0.0',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Abre las herramientas de desarrollo en modo desarrollo
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Habilitar el comando para abrir las herramientas de desarrollo
app.whenReady().then(() => {
  globalShortcut.register('Ctrl+Shift+I', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.webContents.toggleDevTools();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Manejar la apertura de archivos
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'JavaScript/TypeScript', extensions: ['js', 'ts', 'jsx', 'tsx'] },
      { name: 'Todos los archivos', extensions: ['*'] }
    ]
  });
  
  if (canceled) return null;
  
  const filePath = filePaths[0];
  const content = fs.readFileSync(filePath, 'utf-8');
  return { filePath, content };
});

// Manejar el guardado de archivos
ipcMain.handle('dialog:saveFile', async (event, content, suggestedName = 'Untitled.js') => {
  // Si se proporciona una ruta de archivo completa, guardar directamente
  if (suggestedName && suggestedName.includes(path.sep)) {
    fs.writeFileSync(suggestedName, content, 'utf-8');
    return suggestedName;
  } else {
    // Mostrar diálogo para guardar con el nombre sugerido
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Guardar archivo',
      defaultPath: suggestedName,
      filters: [
        { name: 'JavaScript', extensions: ['js'] },
        { name: 'TypeScript', extensions: ['ts'] },
        { name: 'Todos los archivos', extensions: ['*'] }
      ]
    });
    
    if (canceled || !filePath) return null;
    
    // Asegurarse de que el archivo tenga la extensión correcta
    let finalPath = filePath;
    if (!filePath.endsWith('.js') && !filePath.endsWith('.ts')) {
      finalPath = filePath + path.extname(suggestedName);
    }
    
    fs.writeFileSync(finalPath, content, 'utf-8');
    return finalPath;
  }
});

// Manejar la creación de un nuevo archivo
ipcMain.handle('dialog:newFile', () => {
  return { filePath: null, content: '' };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Elimina el handler de ejecución de código, ya no es necesario porque la ejecución es en el renderer
