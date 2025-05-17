const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
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
ipcMain.handle('dialog:saveFile', async (event, content, filePath) => {
  if (filePath) {
    // Si ya hay un filePath, guardar directamente
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
  } else {
    // Si no hay filePath, mostrar diálogo para guardar
    const { canceled, filePath: dialogPath } = await dialog.showSaveDialog({
      title: 'Guardar archivo',
      filters: [
        { name: 'JavaScript', extensions: ['js'] },
        { name: 'TypeScript', extensions: ['ts'] },
        { name: 'Todos los archivos', extensions: ['*'] }
      ]
    });
    if (canceled) return null;
    fs.writeFileSync(dialogPath, content, 'utf-8');
    return dialogPath;
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
